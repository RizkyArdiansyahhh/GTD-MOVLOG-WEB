<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/**
 * Application Service Provider
 *
 * Central place for:
 * - Binding Repository Interfaces to their Eloquent implementations
 * - Registering Policies
 * - Configuring Rate Limiters
 *
 * IMPORTANT: When adding a new Repository, always register the binding here.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ─── Repository Bindings ───────────────────────────────────────────
        // Bind each Repository Interface to its Eloquent Implementation.
        // This enables Dependency Injection throughout the application.
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ─── Policy Registrations ──────────────────────────────────────────
        Gate::policy(User::class, UserPolicy::class);

        // ─── API Rate Limiting ─────────────────────────────────────────────
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(
                (int) config('api.rate_limit', 60)
            )->by($request->user()?->id ?: $request->ip());
        });

        // ─── Strict mode for local/testing environments ────────────────────
        if ($this->app->isLocal()) {
            \Illuminate\Database\Eloquent\Model::shouldBeStrict();
        }
    }
}
