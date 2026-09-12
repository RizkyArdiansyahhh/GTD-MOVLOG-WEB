<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use App\Repositories\Contracts\BaseRepositoryInterface;

/**
 * User Repository Interface
 *
 * Defines user-specific query contracts.
 */
interface UserRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find a user by email address.
     */
    public function findByEmail(string $email): ?\App\Models\User;

    /**
     * Find users by role name.
     */
    public function findByRole(string $role): \Illuminate\Database\Eloquent\Collection;

    /**
     * Search users by name or email.
     */
    public function search(string $keyword, int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * Paginate users with search / role / status filters for Kelola Akun.
     */
    public function paginateFiltered(array $filters, int $perPage = 5): \Illuminate\Contracts\Pagination\LengthAwarePaginator;
}
