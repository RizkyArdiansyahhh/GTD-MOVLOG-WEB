# ==========================================================
# Logistics Management System - Makefile
# ==========================================================

.PHONY: help \
	up down restart build rebuild logs ps \
	shell install setup \
	migrate migrate-fresh seed fresh \
	test lint tinker artisan \
	cache-clear queue-work

# ==========================================================
# Variables
# ==========================================================

COMPOSE = docker compose
APP = app

# ==========================================================
# Help
# ==========================================================

help:
	@echo ""
	@echo "==============================================="
	@echo " Logistics Management System"
	@echo "==============================================="
	@echo ""
	@echo "Docker"
	@echo "  make build        Build Docker images"
	@echo "  make rebuild      Rebuild images without cache"
	@echo "  make up           Start containers"
	@echo "  make down         Stop containers"
	@echo "  make restart      Restart containers"
	@echo "  make logs         Follow logs"
	@echo "  make ps           Show running containers"
	@echo ""
	@echo "Laravel"
	@echo "  make shell        Enter app container"
	@echo "  make install      Install Composer & NPM packages"
	@echo "  make migrate      Run migrations"
	@echo "  make seed         Run seeders"
	@echo "  make fresh        Migrate fresh --seed"
	@echo "  make cache-clear  Clear Laravel cache"
	@echo "  make test         Run tests"
	@echo "  make lint         Run Laravel Pint"
	@echo "  make tinker       Open Tinker"
	@echo "  make artisan      Run artisan command"
	@echo ""
	@echo "Project"
	@echo "  make setup        First-time project setup"
	@echo ""

# ==========================================================
# Docker
# ==========================================================

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache

up:
	@echo "🚀 Starting containers..."
	$(COMPOSE) up -d
	@echo ""
	@echo "Application : http://localhost:8080"
	@echo "pgAdmin     : http://localhost:5050"

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

# ==========================================================
# Development
# ==========================================================

shell:
	$(COMPOSE) exec $(APP) bash

install:
	$(COMPOSE) exec $(APP) composer install
	$(COMPOSE) exec $(APP) npm install

# ==========================================================
# Database
# ==========================================================

migrate:
	$(COMPOSE) exec $(APP) php artisan migrate

seed:
	$(COMPOSE) exec $(APP) php artisan db:seed

fresh:
	$(COMPOSE) exec $(APP) php artisan migrate:fresh --seed

# Alias
migrate-fresh: fresh

# ==========================================================
# Laravel
# ==========================================================

artisan:
	$(COMPOSE) exec $(APP) php artisan $(ARGS)

tinker:
	$(COMPOSE) exec $(APP) php artisan tinker

cache-clear:
	$(COMPOSE) exec $(APP) php artisan optimize:clear

queue-work:
	$(COMPOSE) exec $(APP) php artisan queue:work redis --sleep=3 --tries=3

test:
	$(COMPOSE) exec $(APP) php artisan test --parallel

lint:
	$(COMPOSE) exec $(APP) ./vendor/bin/pint

# ==========================================================
# First Time Setup
# ==========================================================

setup: build up
	@echo "⏳ Waiting for containers..."
	@sleep 10

	@echo "📄 Preparing .env..."
	$(COMPOSE) exec $(APP) sh -c "test -f .env || cp .env.example .env"

	@echo "📦 Installing Composer dependencies..."
	$(COMPOSE) exec $(APP) composer install

	@echo "📦 Installing NPM dependencies..."
	$(COMPOSE) exec $(APP) npm install

	@echo "🔑 Generating application key..."
	$(COMPOSE) exec $(APP) php artisan key:generate

	@echo "🗄️ Running migrations..."
	$(COMPOSE) exec $(APP) php artisan migrate --seed

	@echo ""
	@echo "======================================="
	@echo "✅ Project setup completed!"
	@echo "======================================="
	@echo ""
	@echo "Application : http://localhost:8080"
	@echo "pgAdmin     : http://localhost:5050"