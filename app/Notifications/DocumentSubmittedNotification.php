<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Internal notification: documents for an assignment were submitted
 * (DRAFT/REJECTED -> PENDING) and are waiting for verification.
 *
 * Recipients: active supervisor + super-admin users.
 */
class DocumentSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $assignmentNoRef,
        public readonly int $pendingCount,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type'            => 'document_submitted',
            'title'           => "Berkas {$this->assignmentNoRef} siap diverifikasi ({$this->pendingCount} dokumen menunggu).",
            'assignment_no'   => $this->assignmentNoRef,
            'pending_count'   => $this->pendingCount,
            'url'             => "/verifikasi-berkas/{$this->assignmentNoRef}",
        ];
    }
}
