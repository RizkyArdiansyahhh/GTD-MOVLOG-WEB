<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Document;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Observers\DocumentObserver;
use App\Observers\SessionCheckpointObserver;
use App\Observers\ShippingSessionObserver;
use App\Policies\ShippingSessionPolicy;
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
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
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
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(ShippingSession::class, ShippingSessionPolicy::class);

        // Observers
        ShippingSession::observe(ShippingSessionObserver::class);
        SessionCheckpoint::observe(SessionCheckpointObserver::class);
        Document::observe(DocumentObserver::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(
                (int) config('api.rate_limit', 60)
            )->by($request->user()?->id ?: $request->ip());
        });

        if ($this->app->isLocal()) {
            \Illuminate\Database\Eloquent\Model::shouldBeStrict();
        }
    }
}