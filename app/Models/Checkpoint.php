<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Checkpoint extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'sequence',
        'description',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Shipping sessions currently at this checkpoint.
     */
    public function shippingSessions(): HasMany
    {
        return $this->hasMany(
            ShippingSession::class,
            'current_checkpoint_id'
        );
    }

    /**
     * Session checkpoints.
     */
    public function sessionCheckpoints(): HasMany
    {
        return $this->hasMany(
            SessionCheckpoint::class
        );
    }

    /**
     * Report templates.
     */
    public function reportTemplates(): HasMany
    {
        return $this->hasMany(
            ReportTemplate::class
        );
    }
}