<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Authenticated Session Controller (Web)
 *
 * Handles web (session-based) login and logout for the admin dashboard.
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * POST /login
     * Authenticate the user and redirect to the dashboard.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($user && ! $user->isActive()) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact an Administrator for further assistance.',
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        if ($user) {
            $user->touch();
        }

        if ($user && $user->hasRole('customer')) {
            return redirect()->intended(route('customer.dashboard'));
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * POST /logout
     * Log out the authenticated user.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
