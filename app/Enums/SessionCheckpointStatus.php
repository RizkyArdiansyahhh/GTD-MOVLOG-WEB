<?php

declare(strict_types=1);

namespace App\Enums;

enum SessionCheckpointStatus: string
{
    case PENDING = 'pending';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case SKIPPED = 'skipped';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu',
            self::IN_PROGRESS => 'Aktif',
            self::COMPLETED => 'Selesai',
            self::SKIPPED => 'Dilewati',
        };
    }
}
