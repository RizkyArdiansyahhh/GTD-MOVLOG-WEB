<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Store User Request
 *
 * Handles validation for creating a new user.
 * All validation MUST go here — never in the Controller.
 */
class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\User::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => [
                'nullable',
                Rule::requiredIf(fn () => $this->input('role') === UserRole::Customer->value || $this->input('role') === 'customer'),
                'string',
                'exists:customers,id',
            ],
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'status'   => ['required', Rule::enum(UserStatus::class)],
            'role'     => ['nullable', Rule::enum(UserRole::class)],
            'phone'    => ['nullable', 'string', 'max:20'],
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
            'email.unique' => 'This email address is already registered.',
            'customer_id.required_if' => 'Perusahaan customer wajib dipilih untuk pengguna dengan role customer.',
            'customer_id.exists' => 'Perusahaan customer yang dipilih tidak valid.',
        ];
    }
}