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
            self::Daily => 'Daily Report',
            self::Incident => 'Insiden / Kendala',
            self::Movement => 'Pergerakan Muatan',
            self::Checkpoint => 'Pos Checkpoint',
            self::Final => 'Final Report',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}