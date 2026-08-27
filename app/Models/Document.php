<?php

namespace App\Models;

use App\Enums\DocumentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasUlids;

    protected $fillable = [
        'assignment_no_ref',
        'customer_id',
        'session_id',
        'document_type_id',
        'document_data',
        'file_name',
        'file_path',
        'status',
        'uploaded_by',
        'uploaded_at',
        'verified_by',
        'verified_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'document_data' => 'array',

            'status' => DocumentStatus::class,

            'uploaded_at' => 'datetime',
            'verified_at' => 'datetime',

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

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'uploaded_by'
        );
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}