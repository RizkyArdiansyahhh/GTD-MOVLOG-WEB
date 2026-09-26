<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Internal notification: a session checkpoint stage was completed.
 *
 * Recipients: active supervisor/staff/super-admin users + PIC of the
 * next activated stage (if any). Exactly one row per completion
 * (unlike the customer channel, which also notifies IN_PROGRESS).
 */
class StageCompletedInternalNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly ShippingSession $session,
        public readonly SessionCheckpoint $completedCheckpoint,
        public readonly ?SessionCheckpoint $nextCheckpoint = null,
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
        $checkpointName = $this->completedCheckpoint->checkpoint?->name ?? 'Checkpoint';
        $assignmentNo = (string) $this->session->assignment_no;

        $title = "Tahap {$checkpointName} sesi {$assignmentNo} selesai.";
        if ($this->nextCheckpoint !== null) {
            $nextName = $this->nextCheckpoint->checkpoint?->name ?? 'tahap berikutnya';
            $title .= " Lanjut ke {$nextName}.";
        } else {
            $title .= ' Seluruh tahap selesai.';
        }

        return [
            'type'            => 'stage_completed',
            'title'           => $title,
            'shipment_id'     => (string) $this->session->id,
            'assignment_no'   => $assignmentNo,
            'checkpoint_name' => (string) $checkpointName,
            'url'             => "/monitoring-checkpoint/{$assignmentNo}",
        ];
    }
}
