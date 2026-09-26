<?php

declare(strict_types=1);

namespace App\Enums;

enum SessionCheckpointStatus: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case SKIPPED = 'skipped';

    /**
     * Natural Indonesian label for narrative sentences
     * (e.g. "Tahap Kapal selesai").
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'belum dimulai',
            self::IN_PROGRESS => 'sedang berjalan',
            self::COMPLETED => 'selesai',
            self::SKIPPED => 'dilewati',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}