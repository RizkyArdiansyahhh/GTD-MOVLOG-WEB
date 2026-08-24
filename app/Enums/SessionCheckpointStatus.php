<?php

declare(strict_types=1);

namespace App\Enums;

enum SessionCheckpointStatus: string
{
    case Pending = 'PENDING';
    case InProgress = 'IN_PROGRESS';
    case Completed = 'COMPLETED';
    case Skipped = 'SKIPPED';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu',
            self::InProgress => 'Sedang Berlangsung',
            self::Completed => 'Selesai',
            self::Skipped => 'Dilewati',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}