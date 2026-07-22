<?php

namespace App\Models;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Movement extends Model
{
    use HasUlids;

    protected $fillable = [
        'session_checkpoint_id',
        'parent_movement_id',
        'movement_name',
        'movement_type',
        'sequence',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'movement_type' => MovementType::class,
            'status' => MovementStatus::class,
            'sequence' => 'integer',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function sessionCheckpoint(): BelongsTo
    {
        return $this->belongsTo(SessionCheckpoint::class);
    }

    public function parentMovement(): BelongsTo
    {
        return $this->belongsTo(
            Movement::class,
            'parent_movement_id'
        );
    }

    public function childMovements(): HasMany
    {
        return $this->hasMany(
            Movement::class,
            'parent_movement_id'
        );
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}