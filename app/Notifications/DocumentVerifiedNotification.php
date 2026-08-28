<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Document;
use App\Models\ShippingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentVerifiedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Document $document,
        public readonly ShippingSession $session
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

        return [
            'type'          => 'document_verified',
            'title'         => "{$docTypeName} untuk pengiriman #{$this->session->assignment_no} telah diverifikasi dan siap diunduh.",
            'shipment_id'   => (string) $this->session->id,
            'assignment_no' => (string) $this->session->assignment_no,
            'document_id'   => (string) $this->document->id,
            'document_name' => (string) $this->document->file_name,
            'url'           => "/customer/monitoring-barang/{$this->session->id}",
        ];
    }
}
