<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ShippingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Internal notification: all mandatory documents for an assignment are
 * VERIFIED and a new shipping session was generated (ready to work on).
 *
 * Recipients: active staff + super-admin users (owners of sesi-pekerja).
 */
class SessionReadyNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ShippingSession $session,
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
            'type'          => 'session_ready',
            'title'         => "Sesi {$this->session->assignment_no} siap dikerjakan (seluruh berkas terverifikasi).",
            'shipment_id'   => (string) $this->session->id,
            'assignment_no' => (string) $this->session->assignment_no,
            'url'           => "/sesi-pekerja/{$this->session->id}",
        ];
    }
}
