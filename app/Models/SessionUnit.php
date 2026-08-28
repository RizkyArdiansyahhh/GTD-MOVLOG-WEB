<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionUnit extends Model
{
    use HasUlids;

    protected $fillable = [
        'shipping_session_id',
        'unit_name',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function shippingSession(): BelongsTo
    {
        return $this->belongsTo(
            ShippingSession::class,
            'shipping_session_id'
        );
    }
}