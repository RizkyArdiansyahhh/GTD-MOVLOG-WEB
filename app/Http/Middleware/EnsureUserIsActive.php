<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure User Is Active Middleware
 *
 * Checks if the currently authenticated user has an active status.
 * If account is deactivated, invalidates the session and redirects to login with an error message.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== UserStatus::Active) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            $errorMessage = 'Your account has been deactivated. Please contact an Administrator for further assistance.';

            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::location(route('login'));
            }

            return redirect()->route('login')->withErrors([
                'email' => $errorMessage,
            ]);
        }

        return $next($request);
    }
}
