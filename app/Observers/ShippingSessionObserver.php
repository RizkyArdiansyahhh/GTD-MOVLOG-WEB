<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\ShipmentUpdated;
use App\Models\ShippingSession;
use App\Notifications\ShipmentCompleted;
use Illuminate\Support\Facades\Notification;

class ShippingSessionObserver
{
    public function updated(ShippingSession $session): void
    {
        if ($session->wasChanged(['status', 'current_checkpoint_id', 'notes'])) {
            if (!$session->customer_id) {
                return;
            }

            $session->loadMissing(['customer.users', 'currentCheckpoint', 'sessionCheckpoints.checkpoint']);

            $statusVal = is_object($session->status) ? ($session->status->value ?? (string) $session->status) : (string) $session->status;
            $statusUpper = strtoupper((string) $statusVal);

            $message = match ($statusUpper) {
                'IN_PROGRESS', 'IN_TRANSIT', 'DALAM PERJALANAN' => 'Kargo Anda sedang dalam perjalanan.',
                'COMPLETED', 'DELIVERED', 'TERKIRIM' => 'Kargo telah tiba di tujuan.',
                default => 'Status pengiriman diperbarui.',
            };

            broadcast(new ShipmentUpdated($session, (string) $session->customer_id, $message));

            // Send notification to customer users when shipment is completed
            if ($session->wasChanged('status') && in_array($statusUpper, ['COMPLETED', 'DELIVERED', 'TERKIRIM'], true)) {
                if ($session->customer && $session->customer->users->isNotEmpty()) {
                    Notification::send($session->customer->users, new ShipmentCompleted($session));
                }
            }
        }
    }
}
