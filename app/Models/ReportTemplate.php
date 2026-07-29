<?php

namespace App\Models;

use App\Enums\ReportType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportTemplate extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'checkpoint_id',
        'name',
        'description',
        'applies_to_report_type',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'applies_to_report_type' => ReportType::class,

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the checkpoint that owns this template.
     */
    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    /**
     * Get all template fields.
     */
    public function templateFields(): HasMany
    {
        return $this->hasMany(TemplateField::class, 'template_id');
    }

    /**
     * Get all reports using this template.
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}