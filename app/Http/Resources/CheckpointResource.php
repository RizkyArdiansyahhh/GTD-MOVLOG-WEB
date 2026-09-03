<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Checkpoint Resource
 *
 * Transforms the SessionCheckpoint model into a clean JSON structure
 * exposing the frozen template snapshot and stage status.
 *
 * @mixin \App\Models\SessionCheckpoint
 */
class CheckpointResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $sequence = (int) ($this->checkpoint?->sequence ?? 0);
        $canAddMovement = ($sequence === 1 || $sequence === 3);
        $movementLabel = ($sequence === 1 || $sequence === 2) ? 'Tongkang / LCT' : 'Armada Truk';

        return [
            'id'                  => (string) $this->id,
            'shipping_session_id' => (string) $this->shipping_session_id,
            'checkpoint_id'       => $this->checkpoint_id,
            'sequence'            => $sequence,
            'name'                => $this->checkpoint?->name ?? 'Tahap ' . $sequence,
            'status'              => $this->status?->value ?? (string) $this->status,
            'status_label'        => method_exists($this->status, 'label') ? $this->status->label() : ucfirst((string) $this->status),
            'can_add_movement'    => $canAddMovement,
            'movement_label'      => $movementLabel,
            'actual_start'        => $this->actual_start?->toISOString(),
            'actual_finish'       => $this->actual_finish?->toISOString(),
            'pic'                 => $this->whenLoaded('picUser', fn () => $this->picUser ? [
                'id'    => (string) $this->picUser->id,
                'name'  => $this->picUser->name,
                'email' => $this->picUser->email,
                'phone' => $this->picUser->phone,
            ] : null),
            'template_snapshot'   => $this->template_snapshot,
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
