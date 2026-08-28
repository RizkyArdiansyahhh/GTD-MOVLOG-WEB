<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ShippingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ShipmentCompleted extends Notification
{
    use Queueable;

    public function __construct(
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
        $destination = $this->session->destination ?: 'titik tujuan';

        return [
            'type'          => 'shipment_completed',
            'title'         => "Pengiriman #{$this->session->assignment_no} telah selesai dan diterima di {$destination}.",
            'shipment_id'   => (string) $this->session->id,
            'assignment_no' => (string) $this->session->assignment_no,
            'destination'   => (string) $destination,
            'url'           => "/customer/monitoring-barang/{$this->session->id}",
        ];
    }
}
