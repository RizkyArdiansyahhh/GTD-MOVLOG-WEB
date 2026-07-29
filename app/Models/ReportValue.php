<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportValue extends Model
{
    protected $fillable = [
        'report_id',
        'template_field_id',
        'value',
    ];

    protected function casts(): array
    {
        return [
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
            TemplateField::class
        );
    }
}