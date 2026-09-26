<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Invalidate Stale Sessions Middleware
 *
 * Same guarantee as Laravel's AuthenticateSession (a password change logs
 * out all other sessions on their next request), but keyed per user ID:
 *
 * - Same user ID, different password hash  → logout (stale session).
 * - Different user ID (re-login / user switch) → refresh the stored
 *   fingerprint and continue normally.
 *
 * Stock AuthenticateSession stores a single global hash per session, so any
 * in-session user switch is treated as a hijack and logged out. That breaks
 * legitimate flows that rotate the authenticated user without destroying the
 * session. Keying by user ID keeps the security property without that
 * false positive.
 */
class InvalidateStaleSessions
{
    private const SESSION_KEY = 'gtd_auth_fingerprint';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $request->hasSession()) {
            $current = [
                'id'   => (string) $user->getAuthIdentifier(),
                'hash' => (string) $user->getAuthPassword(),
            ];

            /** @var array{id: string, hash: string}|null $stored */
            $stored = $request->session()->get(self::SESSION_KEY);

            if (
                is_array($stored)
                && ($stored['id'] ?? null) === $current['id']
                && isset($stored['hash'])
                && ! hash_equals((string) $stored['hash'], $current['hash'])
            ) {
                // Stale session: stop the request here like stock
                // AuthenticateSession does, so downstream middleware never
                // sees a half-logged-out request.
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                throw new AuthenticationException('Unauthenticated.');
            }

            $request->session()->put(self::SESSION_KEY, $current);
        }

        return $next($request);
    }
}
