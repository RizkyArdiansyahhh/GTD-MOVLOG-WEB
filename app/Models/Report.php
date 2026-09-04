<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\SyncStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasUlids;

    protected $fillable = [
        'session_checkpoint_id',
        'movement_id',
        'report_template_id',
        'status',
        'event_at',
        'report_type',
        'moved_quantity',
        'description',
        'latitude',
        'longitude',
        'created_by',
        'sync_status',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
            'event_at' => 'datetime',

            'moved_quantity' => 'decimal:2',

            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',

            'report_type' => ReportType::class,
            'sync_status' => SyncStatus::class,

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function sessionCheckpoint(): BelongsTo
    {
        return $this->belongsTo(
            SessionCheckpoint::class
        );
    }

    public function movement(): BelongsTo
    {
        return $this->belongsTo(
            Movement::class
        );
    }

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(
            ReportTemplate::class
        );
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function reportValues(): HasMany
    {
        return $this->hasMany(
            ReportValue::class
        );
    }

    public function values(): HasMany
    {
        return $this->hasMany(
            ReportValue::class
        );
    }

    public function photos(): HasMany
    {
        return $this->hasMany(
            ReportPhoto::class
        );
    }
}