<?php

namespace App\Models;

use App\Enums\SessionCheckpointStatus;
use App\Enums\SyncStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SessionCheckpoint extends Model
{
    use HasUlids;

    protected $fillable = [
        'session_id',
        'checkpoint_id',
        'pic_user_id',
        'status',
        'actual_start',
        'actual_finish',
        'sync_status',
    ];

    protected function casts(): array
    {
        return [
            'status' => SessionCheckpointStatus::class,
            'sync_status' => SyncStatus::class,

            'actual_start' => 'datetime',
            'actual_finish' => 'datetime',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function shippingSession(): BelongsTo
    {
        return $this->belongsTo(
            ShippingSession::class,
            'session_id'
        );
    }

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    public function picUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'pic_user_id'
        );
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}