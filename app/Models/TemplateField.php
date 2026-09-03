<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateField extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'template_id',
        'field_key',
        'field_name',
        'label',
        'field_type',
        'required',
        'options',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'options' => 'array',
            'sort_order' => 'integer',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the report template that owns this field.
     */
    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(
            ReportTemplate::class,
            'template_id'
        );
    }

    /**
     * Get all report values for this template field.
     */
    public function reportValues(): HasMany
    {
        return $this->hasMany(ReportValue::class);
    }

    /**
     * Get all report photos associated with this photo slot template field.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(ReportPhoto::class, 'template_field_id');
    }
}