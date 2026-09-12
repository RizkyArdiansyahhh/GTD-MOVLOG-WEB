<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pic_user_id' => ['required', 'string', Rule::exists('users', 'id')],
            'worker_ids' => ['nullable', 'array'],
        ];
    }
}
