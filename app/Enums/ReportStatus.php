<?php

declare(strict_types=1);

namespace App\Enums;

enum ReportStatus: string
{
    case DRAFT = 'draft';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::IN_PROGRESS => 'Dalam Proses',
            self::COMPLETED => 'Selesai',
        };
    }
}
