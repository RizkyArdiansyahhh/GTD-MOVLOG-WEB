<?php

declare(strict_types=1);

namespace App\Enums;

enum ShippingSessionStatus: string
{
    case PENDING = 'pending';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';

    /**
     * Natural Indonesian label for narrative sentences
     * (e.g. "sesi ini saat ini sedang dalam perjalanan").
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'menunggu diproses',
            self::IN_TRANSIT => 'sedang dalam perjalanan',
            self::DELIVERED => 'telah tiba di tujuan',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}