<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Movement Resource
 *
 * Transforms the Movement model into a consistent JSON structure for physical transport tracking.
 *
 * @mixin \App\Models\Movement
 */
class MovementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                 => (string) $this->id,
            'session_checkpoint_id' => (string) $this->session_checkpoint_id,
            'movement_name'      => $this->movement_name,
            'movement_type'      => $this->movement_type?->value ?? (string) $this->movement_type,
            'parent_movement_id' => $this->parent_movement_id ? (string) $this->parent_movement_id : null,
            'parent_name'        => $this->whenLoaded('parentMovement', fn () => $this->parentMovement?->movement_name),
            'sequence'           => (int) $this->sequence,
            'status'             => $this->status?->value ?? (string) $this->status,
            'created_at'         => $this->created_at?->toISOString(),
            'updated_at'         => $this->updated_at?->toISOString(),
        ];
    }
}
