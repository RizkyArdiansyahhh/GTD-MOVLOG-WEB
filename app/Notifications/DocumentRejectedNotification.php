<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Internal notification: a document was REJECTED by the verifier.
 *
 * Recipients: the uploader (uploaded_by) + active supervisor/super-admin users.
 */
class DocumentRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Document $document,
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
        $docTypeName = $this->document->documentType?->name ?? $this->document->file_name ?? 'Dokumen';
        $assignmentNoRef = (string) ($this->document->assignment_no_ref ?? '');

        $title = "{$docTypeName} untuk {$assignmentNoRef} ditolak dan perlu diperbaiki.";
        if (!empty($this->document->remarks)) {
            $title .= " Alasan: {$this->document->remarks}";
        }

        return [
            'type'            => 'document_rejected',
            'title'           => $title,
            'assignment_no'   => $assignmentNoRef,
            'document_id'     => (string) $this->document->id,
            'document_name'   => (string) $this->document->file_name,
            'remarks'         => $this->document->remarks,
            'url'             => "/submit-berkas/{$assignmentNoRef}/status",
        ];
    }
}
