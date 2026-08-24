<?php

declare(strict_types=1);

namespace App\Enums;

enum MovementType: string
{
    case Loading = 'LOADING';
    case Discharge = 'DISCHARGE';
    case Transit = 'TRANSIT';
    case Inspection = 'INSPECTION';
    case Other = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::Loading => 'Pemuatan (Loading)',
            self::Discharge => 'Pembongkaran (Discharge)',
            self::Transit => 'Transit',
            self::Inspection => 'Pemeriksaan (Inspection)',
            self::Other => 'Lainnya',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}