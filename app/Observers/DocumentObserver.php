<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\DocumentVerified;
use App\Models\Document;
use App\Notifications\DocumentVerifiedNotification;
use Illuminate\Support\Facades\Notification;

class DocumentObserver
{
    public function updated(Document $document): void
    {
        if ($document->wasChanged('status')) {
            $statusVal = is_object($document->status) ? ($document->status->value ?? (string) $document->status) : (string) $document->status;
            $statusUpper = strtoupper((string) $statusVal);

            if (in_array($statusUpper, ['VERIFIED', 'APPROVED'], true)) {
                $document->loadMissing(['documentType', 'shippingSession.customer.users', 'customer.users']);

                $session = $document->shippingSession;
                $customerId = (string) ($document->customer_id ?? $session?->customer_id ?? '');
                $assignmentNo = (string) ($document->assignment_no_ref ?? $session?->assignment_no ?? '');

                if (!empty($customerId)) {
                    broadcast(new DocumentVerified($document, $customerId, $assignmentNo));
                }

                // Send notification to all customer company users
                $users = $session?->customer?->users ?? $document->customer?->users;
                if ($session && $users && $users->isNotEmpty()) {
                    Notification::send($users, new DocumentVerifiedNotification($document, $session));
                }
            }
        }
    }
}
