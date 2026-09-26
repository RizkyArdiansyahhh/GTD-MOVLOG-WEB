<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'movement_name' => ['required', 'string', 'max:255'],
            'parent_movement_id' => ['nullable', 'string'],
        ];
    }
}
