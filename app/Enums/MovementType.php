<?php

declare(strict_types=1);

namespace App\Enums;

enum MovementType: string
{
    case LOADING = 'loading';
    case DISCHARGE = 'discharge';
    case HAULING = 'hauling';
    case TRANSFER = 'transfer';
}
