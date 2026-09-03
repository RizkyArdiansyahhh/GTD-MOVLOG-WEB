<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ShipmentStageUpdated extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ShippingSession $session,
        public readonly SessionCheckpoint $sessionCheckpoint
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
        $checkpointName = $this->sessionCheckpoint->checkpoint?->name ?? 'Pos Transit';
        $statusVal = is_object($this->sessionCheckpoint->status)
            ? ($this->sessionCheckpoint->status->value ?? (string) $this->sessionCheckpoint->status)
            : (string) $this->sessionCheckpoint->status;
        $statusUpper = strtoupper((string) $statusVal);

        $actionText = in_array($statusUpper, ['COMPLETED', 'SELESAI'], true)
            ? "has completed processing at {$checkpointName}"
            : "has arrived at {$checkpointName}";

        return [
            'type'              => 'shipment_stage_updated',
            'title'             => "Cargo #{$this->session->assignment_no} {$actionText}",
            'shipment_id'       => (string) $this->session->id,
            'assignment_no'     => (string) $this->session->assignment_no,
            'checkpoint_name'   => (string) $checkpointName,
            'checkpoint_status' => $statusUpper,
            'url'               => "/customer/monitoring-barang/{$this->session->id}",
        ];
    }
}
