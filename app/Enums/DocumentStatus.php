<?php

declare(strict_types=1);

namespace App\Enums;

enum DocumentStatus: string
{
    case DRAFT = 'DRAFT';
    case PENDING = 'PENDING';
    case VERIFIED = 'VERIFIED';
    case REJECTED = 'REJECTED';
}
