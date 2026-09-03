<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Report Resource
 *
 * Transforms the Report instance model into a consistent JSON structure
 * exposing field values, photos, GPS, and timestamp.
 *
 * @mixin \App\Models\Report
 */
class ReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $valuesMap = [];
        if ($this->relationLoaded('reportValues')) {
            foreach ($this->reportValues as $val) {
                $key = $val->templateField?->field_key ?? (string) $val->template_field_id;
                $valuesMap[$key] = $val->value;
            }
        }

        $photosList = [];
        if ($this->relationLoaded('photos')) {
            foreach ($this->photos as $photo) {
                $photosList[] = [
                    'id'                => (string) $photo->id,
                    'template_field_id' => $photo->template_field_id,
                    'field_key'         => $photo->templateField?->field_key,
                    'photo_url'         => $photo->photo_url,
                    'caption'           => $photo->caption,
                    'taken_at'          => $photo->taken_at?->toISOString(),
                ];
            }
        }

        return [
            'id'                    => (string) $this->id,
            'session_checkpoint_id' => (string) $this->session_checkpoint_id,
            'movement_id'           => (string) $this->movement_id,
            'status'                => $this->status?->value ?? (string) $this->status,
            'event_at'              => $this->event_at?->toISOString(),
            'latitude'              => $this->latitude ? (float) $this->latitude : null,
            'longitude'             => $this->longitude ? (float) $this->longitude : null,
            'values'                => $valuesMap,
            'photos'                => $photosList,
            'created_at'            => $this->created_at?->toISOString(),
            'updated_at'            => $this->updated_at?->toISOString(),
        ];
    }
}
