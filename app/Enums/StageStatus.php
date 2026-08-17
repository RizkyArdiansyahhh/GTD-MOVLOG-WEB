<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Stage Status Enum
 *
 * Defines the lifecycle status of a session stage.
 * Stages progress: pending -> aktif -> selesai (sequential, no skip).
 */
enum StageStatus: string
{
    case Pending = 'pending';
    case Aktif = 'aktif';
    case Selesai = 'selesai';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Aktif => 'Aktif',
            self::Selesai => 'Selesai',
        };
    }
}
