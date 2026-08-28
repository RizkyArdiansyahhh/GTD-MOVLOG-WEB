<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\CheckpointProgressUpdated;
use App\Models\SessionCheckpoint;
use App\Notifications\ShipmentStageUpdated;
use Illuminate\Support\Facades\Notification;

class SessionCheckpointObserver
{
    public function updated(SessionCheckpoint $checkpoint): void
    {
        if ($checkpoint->wasChanged(['status', 'actual_start', 'actual_finish'])) {
            $checkpoint->loadMissing(['checkpoint', 'shippingSession.customer.users']);

            $sessionId = (string) $checkpoint->shipping_session_id;
            $session = $checkpoint->shippingSession;
            $customerId = (string) ($session?->customer_id ?? '');

            if (empty($customerId)) {
                return;
            }

            $total = SessionCheckpoint::where('shipping_session_id', $sessionId)->count();
            $completed = SessionCheckpoint::where('shipping_session_id', $sessionId)
                ->whereIn('status', ['COMPLETED', 'completed', 'SELESAI', 'selesai'])
                ->count();

            $progressPercent = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

            // Broadcast real-time websocket event
            broadcast(new CheckpointProgressUpdated($checkpoint, $sessionId, $customerId, $progressPercent));

            // Send notification to customer users on major status change (IN_PROGRESS or COMPLETED)
            if ($checkpoint->wasChanged('status') && $session && $session->customer) {
                $statusVal = is_object($checkpoint->status) ? ($checkpoint->status->value ?? (string) $checkpoint->status) : (string) $checkpoint->status;
                $statusUpper = strtoupper((string) $statusVal);

                if (in_array($statusUpper, ['IN_PROGRESS', 'COMPLETED', 'SELESAI'], true) && $session->customer->users->isNotEmpty()) {
                    Notification::send($session->customer->users, new ShipmentStageUpdated($session, $checkpoint));
                }
            }
        }
    }
}
