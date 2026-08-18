<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Document Status Enum
 *
 * Defines all possible verification statuses for shipment documents.
 * Used by the Document model and Verifikasi Berkas feature.
 */
enum DocumentStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match (\) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }
}
