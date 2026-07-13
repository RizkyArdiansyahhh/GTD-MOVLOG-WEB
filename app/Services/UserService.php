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
    public function findById(int $id): User
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
            /** @var User $user */
            $user = $this->userRepository->create([
                'name'     => $dto->name,
                'email'    => $dto->email,
                'password' => Hash::make($dto->password),
                'status'   => $dto->status->value,
            ]);

            if ($dto->role) {
                $user->assignRole($dto->role);
            }

            return $user->load('roles');
        });
    }

    /**
     * Update an existing user.
     */
    public function update(int $id, UserDTO $dto): User
    {
        return DB::transaction(function () use ($id, $dto): User {
            $data = [
                'name'   => $dto->name,
                'email'  => $dto->email,
                'status' => $dto->status->value,
            ];

            if ($dto->password) {
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
    public function delete(int $id): bool
    {
        // Business rule: prevent deletion of the last admin user
        $user = $this->findById($id);

        if ($user->hasRole('super-admin')) {
            $adminCount = $this->userRepository->count();

            if ($adminCount <= 1) {
                throw new \App\Exceptions\BusinessException(
                    'Cannot delete the last super-admin user.'
                );
            }
        }

        return $this->userRepository->delete($id);
    }
}
