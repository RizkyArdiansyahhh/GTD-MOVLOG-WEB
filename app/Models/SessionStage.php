<?php

namespace App\Models;

use App\Enums\StageStatus;
use App\Enums\StageType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SessionStage extends Model
{
    use HasUlids;

    protected $fillable = [
        'shipping_session_id',
        'stage_type',
        'stage_order',
        'status',
        'pic_user_id',
        'notes',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'stage_type'   => StageType::class,
            'status'       => StageStatus::class,
            'stage_order'  => 'integer',
            'started_at'   => 'datetime',
            'completed_at' => 'datetime',
            'created_at'   => 'datetime',
            'updated_at'   => 'datetime',
        ];
    }

    public function shippingSession(): BelongsTo
    {
        return $this->belongsTo(ShippingSession::class, 'shipping_session_id');
    }

    public function picUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    /**
     * Workers assigned to this stage (many-to-many via pivot).
     */
    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'session_stage_workers',
            'session_stage_id',
            'worker_user_id'
        );
    }

    /**
     * Check if this stage has a complete assignment (PIC + at least 1 worker).
     */
    public function hasCompleteAssignment(): bool
    {
        return $this->pic_user_id !== null && $this->workers()->count() > 0;
    }
}
