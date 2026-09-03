<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportPhoto extends Model
{
    use HasUlids;

    protected $fillable = [
        'report_id',
        'template_field_id',
        'photo_url',
        'caption',
        'sort_order',
        'is_cover',
        'taken_at',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_cover' => 'boolean',

            'taken_at' => 'datetime',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(
            Report::class
        );
    }

    public function templateField(): BelongsTo
    {
        return $this->belongsTo(
            TemplateField::class,
            'template_field_id'
        );
    }
}