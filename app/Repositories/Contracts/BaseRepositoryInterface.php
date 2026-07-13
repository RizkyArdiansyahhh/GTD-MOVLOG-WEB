<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Base Repository Interface
 *
 * Defines the standard contract for all repository implementations.
 * Repositories are responsible ONLY for database interactions.
 */
interface BaseRepositoryInterface
{
    /**
     * Retrieve all records.
     */
    public function all(array $columns = ['*'], array $relations = []): Collection;

    /**
     * Retrieve a single record by its primary key.
     */
    public function find(int|string $id, array $columns = ['*'], array $relations = []): ?Model;

    /**
     * Retrieve a single record by its primary key or throw a ModelNotFoundException.
     */
    public function findOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model;

    /**
     * Retrieve records by a specific column and value.
     */
    public function findBy(string $column, mixed $value, array $columns = ['*']): Collection;

    /**
     * Retrieve the first record matching the given attributes.
     */
    public function findOneBy(array $criteria, array $columns = ['*']): ?Model;

    /**
     * Create a new record.
     */
    public function create(array $attributes): Model;

    /**
     * Update an existing record by its primary key.
     */
    public function update(int|string $id, array $attributes): Model;

    /**
     * Delete a record by its primary key.
     */
    public function delete(int|string $id): bool;

    /**
     * Paginate records.
     */
    public function paginate(
        int $perPage = 15,
        array $columns = ['*'],
        array $relations = [],
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Check whether a record exists by the given criteria.
     */
    public function exists(array $criteria): bool;

    /**
     * Count records matching the given criteria.
     */
    public function count(array $criteria = []): int;
}
