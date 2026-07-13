<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * User Role Enum
 *
 * Defines all available roles in the Logistics Management System.
 * Used with Spatie Laravel Permission.
 */
enum UserRole: string
{
    case SuperAdmin = 'super-admin';
    case Admin      = 'admin';
    case Manager    = 'manager';
    case Driver     = 'driver';
    case Warehouse  = 'warehouse';
    case Customer   = 'customer';

    /**
     * Get a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin      => 'Admin',
            self::Manager    => 'Manager',
            self::Driver     => 'Driver',
            self::Warehouse  => 'Warehouse Staff',
            self::Customer   => 'Customer',
        };
    }

    /**
     * Get all role values as an array.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
