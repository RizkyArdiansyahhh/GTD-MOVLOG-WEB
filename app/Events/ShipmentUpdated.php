<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\ShippingSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShipmentUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ShippingSession $session,
        public string $customerId,
        public string $message
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('customer.' . $this->customerId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'shipment.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'session' => $this->session,
            'customerId' => $this->customerId,
            'message' => $this->message,
        ];
    }
}
