<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Auth Service
 *
 * Handles all authentication business logic: login, register, logout.
 * Token management is handled here via Sanctum.
 */
class AuthService extends BaseService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Authenticate a user and return an API token.
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password, string $deviceName = 'api'): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is currently deactivated. Please contact an Administrator for further information.'],
            ]);
        }

        // Revoke all previous tokens for the device
        $user->tokens()->where('name', $deviceName)->delete();

        $user->touch();

        $token = $user->createToken($deviceName)->plainTextToken;

        return [
            'user'  => $user->load('roles'),
            'token' => $token,
        ];
    }

    /**
     * Register a new user (public registration).
     */
    public function register(array $data): array
    {
        /** @var User $user */
        $user = $this->userRepository->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'status'   => \App\Enums\UserStatus::Active->value,
        ]);

        $user->assignRole(\App\Enums\UserRole::Driver->value);

        $token = $user->createToken('api')->plainTextToken;

        return [
            'user'  => $user->load('roles'),
            'token' => $token,
        ];
    }

    /**
     * Revoke all tokens for the authenticated user (logout).
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Retrieve the authenticated user with roles and permissions.
     */
    public function me(User $user): User
    {
        return $user->load(['roles', 'permissions']);
    }
}
