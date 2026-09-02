<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\UserDTO;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\LaravelData\Optional;

/**
 * User Service
 *
 * Contains all business logic related to User management.
 * This class MUST NOT access the database directly — use UserRepositoryInterface instead.
 */
class UserService extends BaseService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Retrieve a paginated list of users.
     */
    public function list(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        if ($search) {
            return $this->userRepository->search($search, $perPage);
        }

        return $this->userRepository->paginate(
            perPage: $perPage,
            relations: ['roles']
        );
    }

    /**
     * Retrieve a single user by ID.
     */
    public function findById(int|string $id): User
    {
        /** @var User */
        return $this->userRepository->findOrFail($id, relations: ['roles', 'permissions']);
    }

    /**
     * Create a new user with the given role.
     */
    public function create(UserDTO $dto): User
    {
        return DB::transaction(function () use ($dto): User {
            $userData = [
                'name'     => $dto->name,
                'email'    => $dto->email,
                'password' => Hash::make($dto->password),
                'status'   => $dto->status->value,
            ];

            if ($dto->customer_id && !($dto->customer_id instanceof Optional)) {
                $userData['customer_id'] = $dto->customer_id;
            }

            /** @var User $user */
            $user = $this->userRepository->create($userData);

            if ($dto->role) {
                $user->assignRole($dto->role);
            }

            return $user->load('roles');
        });
    }

    /**
     * Update an existing user.
     */
    public function update(int|string $id, UserDTO $dto): User
    {
        return DB::transaction(function () use ($id, $dto): User {
            $data = [
                'name'   => $dto->name,
                'email'  => $dto->email,
                'status' => $dto->status->value,
            ];

            if ($dto->customer_id !== null && !($dto->customer_id instanceof Optional)) {
                $data['customer_id'] = $dto->customer_id;
            }

            if (is_string($dto->password) && $dto->password !== '') {
                $data['password'] = Hash::make($dto->password);
            }

            /** @var User $user */
            $user = $this->userRepository->update($id, $data);

            if ($dto->role) {
                $user->syncRoles([$dto->role]);
            }

            return $user->load('roles');
        });
    }

    /**
     * Delete a user by ID.
     */
    public function delete(int|string $id, ?User $currentUser = null): bool
    {
        /** @var User|null $user */
        $user = $this->userRepository->find($id);

        if (!$user) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('User not found.');
        }

        // Business rule 1: Prevent deletion of currently logged-in user
        if ($currentUser && (string) $currentUser->id === (string) $user->id) {
            throw new \App\Exceptions\BusinessException(
                'Anda tidak dapat menghapus akun Anda sendiri.'
            );
        }

        // Business rule 2: Prevent deletion of the last admin user
        $isAdmin = $user->hasAnyRole(['super-admin', 'admin', 'Super Admin']);
        if ($isAdmin) {
            $adminCount = User::whereHas('roles', function ($q) {
                $q->whereIn('name', ['super-admin', 'admin', 'Super Admin']);
            })->count();

            if ($adminCount <= 1) {
                throw new \App\Exceptions\BusinessException(
                    'Minimal harus ada satu akun Admin.'
                );
            }
        }

        return $this->userRepository->delete($id);
    }
}