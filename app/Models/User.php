<?php

namespace App\Models;

use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use HasUlids;
    use HasRoles;
    use SoftDeletes;

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'phone',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'status' => UserStatus::class,
            'email_verified_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Check if the user account is active.
     */
    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /**
     * Get the public URL for the user's avatar.
     *
     * Returns the storage URL if an avatar exists, otherwise null.
     * This accessor allows `avatar_url` to be accessed on the model
     * (used in HandleInertiaRequests middleware and UserResource).
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar ? Storage::url($this->avatar) : null,
        );
    }

    /**
     * Shipping sessions created by this user.
     */
    public function shippingSessions(): HasMany
    {
        return $this->hasMany(ShippingSession::class, 'created_by');
    }

    /**
     * Documents uploaded by this user.
     */
    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    /**
     * Documents verified by this user.
     */
    public function verifiedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'verified_by');
    }

    /**
     * Session checkpoints handled by this user.
     */
    public function sessionCheckpoints(): HasMany
    {
        return $this->hasMany(SessionCheckpoint::class, 'pic_user_id');
    }

    /**
     * Movements created by this user.
     */
    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class, 'created_by');
    }

    /**
     * Reports created by this user.
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'created_by');
    }
}