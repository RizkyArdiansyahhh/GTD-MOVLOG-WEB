<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * User Status Enum
 *
 * Represents the lifecycle status of a user account.
 */
enum UserStatus: string
{
    case Active   = 'active';
    case Inactive = 'inactive';
    case Banned   = 'banned';
    case Pending  = 'pending';

    /**
     * Get a human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active   => 'Active',
            self::Inactive => 'Inactive',
            self::Banned   => 'Banned',
            self::Pending  => 'Pending Verification',
        };
    }

    /**
     * Check if the status allows system access.
     */
    public function canAccess(): bool
    {
        return $this === self::Active;
    }

    /**
     * Get all status values as an array.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
