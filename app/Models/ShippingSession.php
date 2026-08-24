<?php

namespace App\Models;

use App\Enums\ShippingSessionStatus;
use App\Enums\StageStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ShippingSession extends Model
{
    use HasUlids;

    protected $fillable = [
        'customer_id',
        'created_by',
        'assignment_no',
        'cargo_name',
        'total_quantity',
        'unit',
        'origin',
        'destination',
        'current_checkpoint_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_quantity' => 'decimal:2',
            'status' => ShippingSessionStatus::class,

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function currentCheckpoint(): BelongsTo
    {
        return $this->belongsTo(
            Checkpoint::class,
            'current_checkpoint_id'
        );
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function sessionCheckpoints(): HasMany
    {
        return $this->hasMany(SessionCheckpoint::class);
    }

    /**
     * Logistics stages for this session (kapal -> tongkang -> pelabuhan -> site).
     */
    public function stages(): HasMany
    {
        return $this->hasMany(SessionStage::class, 'shipping_session_id')
            ->orderBy('stage_order');
    }

    /**
     * Heavy equipment units assigned to this session.
     */
    public function units(): HasMany
    {
        return $this->hasMany(SessionUnit::class, 'shipping_session_id');
    }

    /**
     * Get the currently active stage (there should be at most one).
     */
    public function activeStage(): HasOne
    {
        return $this->hasOne(SessionStage::class, 'shipping_session_id')
            ->where('status', StageStatus::Aktif);
    }
}
