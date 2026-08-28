<?php

declare(strict_types=1);

namespace App\Enums;

enum ReportType: string
{
    case Daily = 'DAILY';
    case Incident = 'INCIDENT';
    case Movement = 'MOVEMENT';
    case Checkpoint = 'CHECKPOINT';
    case Final = 'FINAL';

    public function label(): string
    {
        return match ($this) {
            self::Daily => 'Laporan Harian',
            self::Incident => 'Insiden / Kendala',
            self::Movement => 'Pergerakan Muatan',
            self::Checkpoint => 'Pos Checkpoint',
            self::Final => 'Laporan Akhir (Final)',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}