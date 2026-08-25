<?php

declare(strict_types=1);

namespace App\Enums;

enum SyncStatus: string
{
    case SYNCED = 'SYNCED';
    case PENDING = 'PENDING';
    case FAILED = 'FAILED';
}
