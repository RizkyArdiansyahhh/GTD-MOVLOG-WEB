<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Base Eloquent Repository
 *
 * Provides a default implementation of BaseRepositoryInterface using Eloquent ORM.
 * All repository classes should extend this class.
 */
abstract class BaseRepository implements BaseRepositoryInterface
{
    /**
     * The Eloquent model instance.
     */
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * {@inheritdoc}
     */
    public function all(array $columns = ['*'], array $relations = []): Collection
    {
        return $this->model->newQuery()
            ->select($columns)
            ->with($relations)
            ->get();
    }

    /**
     * {@inheritdoc}
     */
    public function find(int|string $id, array $columns = ['*'], array $relations = []): ?Model
    {
        return $this->model->newQuery()
            ->select($columns)
            ->with($relations)
            ->find($id);
    }

    /**
     * {@inheritdoc}
     */
    public function findOrFail(int|string $id, array $columns = ['*'], array $relations = []): Model
    {
        $model = $this->find($id, $columns, $relations);

        if (! $model) {
            throw (new ModelNotFoundException())->setModel(
                get_class($this->model),
                $id
            );
        }

        return $model;
    }

    /**
     * {@inheritdoc}
     */
    public function findBy(string $column, mixed $value, array $columns = ['*']): Collection
    {
        return $this->model->newQuery()
            ->select($columns)
            ->where($column, $value)
            ->get();
    }

    /**
     * {@inheritdoc}
     */
    public function findOneBy(array $criteria, array $columns = ['*']): ?Model
    {
        return $this->model->newQuery()
            ->select($columns)
            ->where($criteria)
            ->first();
    }

    /**
     * {@inheritdoc}
     */
    public function create(array $attributes): Model
    {
        return $this->model->newQuery()->create($attributes);
    }

    /**
     * {@inheritdoc}
     */
    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);
        $model->update($attributes);

        return $model->fresh();
    }

    /**
     * {@inheritdoc}
     */
    public function delete(int|string $id): bool
    {
        $model = $this->findOrFail($id);

        return (bool) $model->delete();
    }

    /**
     * {@inheritdoc}
     */
    public function paginate(
        int $perPage = 15,
        array $columns = ['*'],
        array $relations = [],
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->model->newQuery()
            ->select($columns)
            ->with($relations);

        if (! empty($filters)) {
            $query->where($filters);
        }

        return $query->paginate($perPage);
    }

    /**
     * {@inheritdoc}
     */
    public function exists(array $criteria): bool
    {
        return $this->model->newQuery()->where($criteria)->exists();
    }

    /**
     * {@inheritdoc}
     */
    public function count(array $criteria = []): int
    {
        $query = $this->model->newQuery();

        if (! empty($criteria)) {
            $query->where($criteria);
        }

        return $query->count();
    }
}
