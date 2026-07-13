# Logistics Management System — Makefile
# ─────────────────────────────────────────────────────────────────────
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────

.PHONY: help up down restart build shell logs \
        install migrate seed fresh test lint \
        artisan tinker cache-clear queue-work

# ── Default target ────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Logistics Management System"
	@echo "  ─────────────────────────────────────────"
	@echo ""
	@echo "  Docker:"
	@echo "    make up          Start all containers"
	@echo "    make down        Stop all containers"
	@echo "    make restart     Restart all containers"
	@echo "    make build       Rebuild containers"
	@echo "    make logs        Show container logs"
	@echo ""
	@echo "  Development:"
	@echo "    make shell       Enter the app container (bash)"
	@echo "    make install     Install PHP & JS dependencies"
	@echo "    make migrate     Run migrations"
	@echo "    make seed        Run seeders"
	@echo "    make fresh       Migrate fresh + seed"
	@echo "    make test        Run PHPUnit tests"
	@echo "    make lint        Run Laravel Pint (PSR-12)"
	@echo "    make tinker      Open Laravel Tinker"
	@echo "    make cache-clear Clear all caches"
	@echo ""

# ── Docker ────────────────────────────────────────────────────────────
up:
	@echo "🚀 Starting containers..."
	docker compose up -d
	@echo "✅ Application running at http://localhost:8080"
	@echo "   pgAdmin running at  http://localhost:5050"

down:
	@echo "🛑 Stopping containers..."
	docker compose down

restart:
	docker compose restart

build:
	@echo "🔨 Building containers..."
	docker compose build --no-cache

logs:
	docker compose logs -f --tail=50

# ── Development ───────────────────────────────────────────────────────
shell:
	docker compose exec app bash

install:
	@echo "📦 Installing PHP dependencies..."
	docker compose exec app composer install
	@echo "📦 Installing JS dependencies..."
	docker compose exec app npm install

migrate:
	docker compose exec app php artisan migrate

seed:
	docker compose exec app php artisan db:seed

fresh:
	@echo "⚠️  Running migrate:fresh --seed (this will DESTROY the database!)"
	docker compose exec app php artisan migrate:fresh --seed

test:
	docker compose exec app php artisan test --parallel

lint:
	docker compose exec app ./vendor/bin/pint

artisan:
	docker compose exec app php artisan $(ARGS)

tinker:
	docker compose exec app php artisan tinker

cache-clear:
	docker compose exec app php artisan cache:clear
	docker compose exec app php artisan config:clear
	docker compose exec app php artisan route:clear
	docker compose exec app php artisan view:clear
	@echo "✅ All caches cleared."

queue-work:
	docker compose exec app php artisan queue:work redis --sleep=3 --tries=3

# ── Shortcut: Setup from scratch ──────────────────────────────────────
setup: build up
	@echo "⏳ Waiting for containers to be ready..."
	sleep 5
	docker compose exec app composer install
	docker compose exec app npm install
	docker compose exec app php artisan key:generate
	docker compose exec app php artisan migrate --seed
	docker compose exec app npm run build
	@echo "🎉 Setup complete! Visit http://localhost:8080"
