<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Document;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentVerified implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Document $document,
        public string $customerId,
        public string $assignmentNo
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('customer.' . $this->customerId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'document.verified';
    }

    public function broadcastWith(): array
    {
        return [
            'document' => $this->document,
            'customerId' => $this->customerId,
            'assignmentNo' => $this->assignmentNo,
        ];
    }
}
