<?php

declare(strict_types=1);

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Builder;

/**
 * Shipping Session Repository Interface
 *
 * Defines query contracts specific to ShippingSession data access.
 */
interface ShippingSessionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Return a scoped query builder for sessions within a date range,
     * optionally filtered by customer and/or status.
     *
     * Callers are responsible for eager-loading relations and calling ->get()
     * or ->chunk() on the returned builder.
     */
    public function findByDateRange(
        string $startDate,
        string $endDate,
        ?string $customerId = null,
        ?string $status = null,
        ?string $search = null,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc',
    ): Builder;
}
