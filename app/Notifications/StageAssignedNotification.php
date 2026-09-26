<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SessionCheckpoint;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Internal notification: a field worker was assigned as PIC
 * of a session checkpoint stage.
 *
 * Recipient: the assigned user directly.
 */
class StageAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly SessionCheckpoint $sessionCheckpoint,
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
        $session = $this->sessionCheckpoint->shippingSession;
        $checkpointName = $this->sessionCheckpoint->checkpoint?->name ?? 'Checkpoint';
        $assignmentNo = (string) ($session?->assignment_no ?? '');

        return [
            'type'            => 'stage_assigned',
            'title'           => "Anda ditugaskan pada tahap {$checkpointName} sesi {$assignmentNo}.",
            'shipment_id'     => $session ? (string) $session->id : null,
            'assignment_no'   => $assignmentNo,
            'checkpoint_name' => (string) $checkpointName,
            'url'             => $session ? "/sesi-pekerja/{$session->id}" : '/sesi-pekerja',
        ];
    }
}
