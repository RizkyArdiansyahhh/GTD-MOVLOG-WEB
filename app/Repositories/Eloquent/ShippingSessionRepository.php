<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\ShippingSession;
use Carbon\Carbon;
use App\Repositories\Contracts\ShippingSessionRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * Eloquent implementation of ShippingSessionRepositoryInterface.
 */
class ShippingSessionRepository extends BaseRepository implements ShippingSessionRepositoryInterface
{
    public function __construct(ShippingSession $model)
    {
        parent::__construct($model);
    }

    /**
     * {@inheritdoc}
     */
    public function findByDateRange(
        string $startDate,
        string $endDate,
        ?string $customerId = null,
        ?string $status = null,
        ?string $search = null,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc',
    ): Builder {
        $from = Carbon::parse($startDate, 'Asia/Jakarta')->startOfDay();
        $to   = Carbon::parse($endDate, 'Asia/Jakarta')->endOfDay();

        return $this->model->newQuery()
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to)
            ->when($customerId, fn (Builder $q) => $q->where('customer_id', $customerId))
            ->when($status, fn (Builder $q) => $q->whereRaw('LOWER(status::text) = ?', [strtolower($status)]))
            ->when($search, function (Builder $q) use ($search) {
                $term = '%' . $search . '%';
                $q->where(function (Builder $sub) use ($term) {
                    $sub->where('assignment_no', 'ilike', $term)
                        ->orWhere('cargo_name', 'ilike', $term)
                        ->orWhere('origin', 'ilike', $term)
                        ->orWhere('destination', 'ilike', $term)
                        ->orWhereHas('customer', fn (Builder $c) => $c->where('company_name', 'ilike', $term));
                });
            })
            ->orderBy($sortBy, $sortDirection);
    }
}
