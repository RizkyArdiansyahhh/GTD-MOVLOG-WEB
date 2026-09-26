<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|min:10|max:15',
            'email' => 'nullable|email|max:255',
            'pic_name' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'phone.min' => 'Nomor HP minimal 10 karakter.',
            'phone.max' => 'Nomor HP maksimal 15 karakter.',
        ];
    }
}
