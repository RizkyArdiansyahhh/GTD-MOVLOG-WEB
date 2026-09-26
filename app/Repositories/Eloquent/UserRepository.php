<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * User Repository (Eloquent Implementation)
 *
 * Handles all database operations related to the User model.
 * This class MUST NOT contain any business logic.
 */
class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    /**
     * {@inheritdoc}
     */
    public function findByEmail(string $email): ?User
    {
        /** @var User|null */
        return $this->model->newQuery()
            ->where('email', $email)
            ->first();
    }

    /**
     * {@inheritdoc}
     */
    public function findByRole(string $role): Collection
    {
        return $this->model->newQuery()
            ->role($role)
            ->get();
    }

    /**
     * {@inheritdoc}
     */
    public function search(string $keyword, int $perPage = 15): LengthAwarePaginator
    {
        // Escape LIKE wildcards so the keyword is matched literally.
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $keyword);
        $pattern = "%{$escaped}%";

        return $this->model->newQuery()
            ->where(function ($query) use ($pattern) {
                $query->whereRaw("name ILIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("email ILIKE ? ESCAPE '\\'", [$pattern]);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * {@inheritdoc}
     */
    public function paginateFiltered(array $filters, int $perPage = 5): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with(['roles', 'customer'])->orderBy('created_at', 'desc');

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            // Escape LIKE wildcards so the keyword is matched literally.
            $keyword = strtolower(str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search));
            $query->where(function ($q) use ($keyword) {
                $q->whereRaw("LOWER(name) LIKE ? ESCAPE '\\'", ["%{$keyword}%"])
                    ->orWhereRaw("LOWER(email) LIKE ? ESCAPE '\\'", ["%{$keyword}%"]);
            });
        }

        $role = $filters['role'] ?? null;
        if ($role && $role !== 'All Roles') {
            $spatieRoleName = strtolower($role);
            $map = [
                'super admin' => 'super-admin',
                'supervisor' => 'supervisor',
                'staff' => 'staff',
                'field worker' => 'field-worker',
                'customer' => 'customer',
            ];
            $spatieRoleName = $map[strtolower($role)] ?? $spatieRoleName;
            $query->whereHas('roles', function ($q) use ($spatieRoleName, $role) {
                $q->whereIn('name', array_unique([$spatieRoleName, strtolower((string) $role)]));
            });
        }

        $status = $filters['status'] ?? null;
        if ($status && $status !== 'All Statuses') {
            $statusValue = match (strtolower((string) $status)) {
                'aktif', 'active' => 'active',
                'tidak aktif', 'inactive' => 'inactive',
                'pending', 'pending verification' => 'pending',
                default => null,
            };
            if ($statusValue) {
                $query->where('status', $statusValue);
            }
        }

        return $query->paginate($perPage)->withQueryString();
    }
}
