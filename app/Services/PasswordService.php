<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Password Service
 *
 * Single entry point for every password change in the application
 * (forgot-password reset, internal profile, customer profile).
 *
 * Centralizing here guarantees two invariants everywhere:
 * - The plain value is stored exactly once (the User model 'hashed'
 *   cast performs the single hashing pass).
 * - The remember token is rotated, so every previously issued
 *   "remember me" cookie is invalidated immediately.
 */
class PasswordService
{
    public function updatePassword(User $user, string $plainPassword): void
    {
        $user->forceFill([
            'password'       => $plainPassword,
            'remember_token' => Str::random(60),
        ])->save();
    }
}
