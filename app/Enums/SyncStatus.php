<?php

declare(strict_types=1);

namespace App\Enums;

enum SyncStatus: string
{
    case SYNCED = 'SYNCED';
    case PENDING = 'PENDING';
    case FAILED = 'FAILED';

    public function label(): string
    {
        return match ($this) {
            self::SYNCED => 'Tersinkronisasi',
            self::PENDING => 'Menunggu Sinkronisasi',
            self::FAILED => 'Gagal Sinkron',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}