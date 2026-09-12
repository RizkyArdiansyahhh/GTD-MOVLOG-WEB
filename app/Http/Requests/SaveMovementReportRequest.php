<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveMovementReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fields' => ['nullable', 'array'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'event_at' => ['nullable', 'date'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['nullable', 'file', 'image', 'max:10240'],
        ];
    }
}
