<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Session Resource
 *
 * Transforms the ShippingSession model into a consistent JSON structure
 * for mobile and API consumers.
 *
 * @mixin \App\Models\ShippingSession
 */
class SessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => (string) $this->id,
            'assignment_no'  => $this->assignment_no,
            'cargo_name'     => $this->cargo_name,
            'total_quantity' => $this->total_quantity ? (float) $this->total_quantity : null,
            'unit'           => $this->unit,
            'origin'         => $this->origin,
            'destination'    => $this->destination,
            'status'         => $this->status?->value ?? (string) $this->status,
            'status_label'   => method_exists($this->status, 'label') ? $this->status->label() : ucfirst((string) $this->status),
            'notes'          => $this->notes,
            'current_checkpoint' => $this->whenLoaded('currentCheckpoint', fn () => [
                'id'       => $this->currentCheckpoint->id,
                'sequence' => $this->currentCheckpoint->sequence,
                'name'     => $this->currentCheckpoint->name,
            ]),
            'units' => $this->whenLoaded('units', fn () => $this->units->map(fn ($u) => [
                'id'        => (string) $u->id,
                'unit_name' => $u->unit_name,
                'quantity'  => (int) $u->quantity,
                'notes'     => $u->notes,
            ])),
            'checkpoints' => CheckpointResource::collection($this->whenLoaded('sessionCheckpoints')),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
