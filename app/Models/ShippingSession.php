<?php

namespace App\Models;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
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
        'notes',
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
        return $this->hasMany(SessionCheckpoint::class, 'shipping_session_id');
    }

    public function activeSessionCheckpoint(): HasOne
    {
        return $this->hasOne(SessionCheckpoint::class, 'shipping_session_id')
            ->where('status', SessionCheckpointStatus::IN_PROGRESS);
    }

    public function units(): HasMany
    {
        return $this->hasMany(SessionUnit::class, 'shipping_session_id');
    }
}