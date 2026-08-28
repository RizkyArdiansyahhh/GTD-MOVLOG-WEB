<?php

declare(strict_types=1);

namespace App\Enums;

enum ShippingSessionStatus: string
{
    case PENDING = 'pending';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu',
            self::IN_TRANSIT => 'Dalam Perjalanan',
            self::DELIVERED => 'Selesai',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}