<?php

declare(strict_types=1);

namespace App\Enums;

enum SyncStatus: string
{
    case Synced = 'SYNCED';
    case Pending = 'PENDING';
    case Failed = 'FAILED';

    public function label(): string
    {
        return match ($this) {
            self::Synced => 'Tersinkronisasi',
            self::Pending => 'Menunggu Sinkronisasi',
            self::Failed => 'Gagal Sinkron',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}