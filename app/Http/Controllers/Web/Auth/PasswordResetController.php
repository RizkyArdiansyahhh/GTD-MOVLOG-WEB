<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Services\PasswordService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Password Reset Controller (Web)
 *
 * Guest-only forgot/reset password flow using Laravel's password broker.
 * Responses are intentionally generic so callers cannot enumerate
 * registered email addresses.
 */
class PasswordResetController extends Controller
{
    /**
     * Single source of truth for the forgot-password response.
     *
     * Must be returned verbatim for registered, unregistered, throttled,
     * and mail-transport-failure cases so callers cannot enumerate
     * registered email addresses.
     */
    public const GENERIC_SUCCESS = 'If the email address is registered, a password reset link has been sent.';

    /**
     * GET /forgot-password
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * POST /forgot-password
     * Send the reset link. Always responds with success to prevent
     * user enumeration, whether or not the email is registered.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = (string) $request->input('email');

        try {
            $status = Password::sendResetLink($request->only('email'));

            Log::info('password.reset.link_requested', [
                'email' => $email,
                'status' => $status,
            ]);

            if ($status !== Password::RESET_LINK_SENT) {
                Log::warning('password.reset.link_not_sent', [
                    'email' => $email,
                    'status' => $status,
                ]);
            }
        } catch (Throwable $e) {
            Log::error('password.reset.mail_failed', [
                'email' => $email,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);
        }

        return back()->with('success', self::GENERIC_SUCCESS);
    }

    /**
     * GET /reset-password/{token}
     */
    public function edit(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    /**
     * POST /reset-password
     * Reset the password, invalidate the token, then redirect to login
     * for a manual sign-in (no auto-login).
     *
     * @throws ValidationException
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'string',
                'confirmed',
                PasswordRule::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                app(PasswordService::class)
                    ->updatePassword($user, $request->input('password'));

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return redirect()->route('login')
            ->with('success', 'Your password has been reset. Please sign in with your new password.');
    }
}
