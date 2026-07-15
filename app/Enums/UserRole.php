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
    case Supervisor = 'supervisor';
    case Staff = 'staff';
    case FieldWorker = 'field-worker';
    case Customer = 'customer';

    /**
     * Get a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Supervisor => 'Supervisor',
            self::Staff => 'Staff',
            self::FieldWorker => 'Field Worker',
            self::Customer => 'Customer',
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
