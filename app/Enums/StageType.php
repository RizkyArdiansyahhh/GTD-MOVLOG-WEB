<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Stage Type Enum
 *
 * Defines the 4 sequential logistics stages for a shipping session.
 * Each session progresses through these stages in fixed order.
 */
enum StageType: string
{
    case Kapal = 'kapal';
    case Tongkang = 'tongkang';
    case Pelabuhan = 'pelabuhan';
    case Site = 'site';

    /**
     * Get a human-readable label for the stage.
     */
    public function label(): string
    {
        return match ($this) {
            self::Kapal => 'Kapal',
            self::Tongkang => 'Tongkang',
            self::Pelabuhan => 'Pelabuhan',
            self::Site => 'Site',
        };
    }

    /**
     * Get the fixed order number for this stage (1-based).
     */
    public function order(): int
    {
        return match ($this) {
            self::Kapal => 1,
            self::Tongkang => 2,
            self::Pelabuhan => 3,
            self::Site => 4,
        };
    }

    /**
     * Get all stage types in their fixed sequential order.
     */
    public static function ordered(): array
    {
        return [
            self::Kapal,
            self::Tongkang,
            self::Pelabuhan,
            self::Site,
        ];
    }
}
