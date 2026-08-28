<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Customer Profile Request
 *
 * Handles validation for customer profile updates.
 * Security Decision: customer_id and email are strictly omitted and not processable.
 */
class UpdateCustomerProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('customer') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'avatar'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'delete_avatar' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max'      => 'Nama lengkap tidak boleh lebih dari 255 karakter.',
            'phone.max'     => 'Nomor telepon tidak boleh lebih dari 20 karakter.',
            'avatar.image'  => 'Berkas avatar harus berupa gambar.',
            'avatar.mimes'  => 'Format foto profil harus JPG, PNG, atau WEBP.',
            'avatar.max'    => 'Ukuran foto profil tidak boleh melebihi 2MB.',
        ];
    }
}
