<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasUlids;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'company_name',
        'address',
        'phone',
        'email',
        'pic_name',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Override toArray() untuk menambahkan companyName dan picName
     * sebagai alias camelCase tanpa menggunakan accessor Attribute::make()
     * yang berkonflik dengan HasUlids + Laravel 12 magic accessor routing.
     */
    public function toArray(): array
    {
        $array = parent::toArray();
        $array['companyName'] = $this->attributes['company_name'] ?? null;
        $array['picName']     = $this->attributes['pic_name'] ?? null;
        return $array;
    }

    /**
     * Get all shipping sessions for this customer.
     */
    public function shippingSessions(): HasMany
    {
        return $this->hasMany(ShippingSession::class);
    }
}
