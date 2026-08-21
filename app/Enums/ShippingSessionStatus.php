<?php

declare(strict_types=1);

namespace App\Enums;

enum ShippingSessionStatus: string
{
    case PENDING = 'pending';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
}
