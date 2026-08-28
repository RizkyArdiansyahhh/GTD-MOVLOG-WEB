<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\SessionCheckpoint;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CheckpointProgressUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public SessionCheckpoint $checkpoint,
        public string $sessionId,
        public string $customerId,
        public int $progressPercent
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('customer.' . $this->customerId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'checkpoint.progress';
    }

    public function broadcastWith(): array
    {
        return [
            'checkpoint' => $this->checkpoint,
            'sessionId' => $this->sessionId,
            'customerId' => $this->customerId,
            'progressPercent' => $this->progressPercent,
        ];
    }
}
