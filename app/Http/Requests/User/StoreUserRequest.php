<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
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
        return $this->user()->can('create', User::class);
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize role check
        $role = $this->input('role');
        $isCustomer = in_array(strtolower((string) $role), [
            UserRole::Customer->value,
            'customer',
        ], true);

        if ($isCustomer) {
            // Synchronize company_id and customer_id
            if ($this->filled('company_id') && ! $this->filled('customer_id')) {
                $this->merge(['customer_id' => $this->input('company_id')]);
            } elseif ($this->filled('customer_id') && ! $this->filled('company_id')) {
                $this->merge(['company_id' => $this->input('customer_id')]);
            }
        } else {
            // Ensure company is not assigned to non-customer accounts
            $this->merge([
                'company_id' => null,
                'customer_id' => null,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $role = $this->input('role');
        $isCustomerRole = in_array(strtolower((string) $role), [
            UserRole::Customer->value,
            'customer',
        ], true);

        return [
            'company_id' => [
                'nullable',
                Rule::requiredIf($isCustomerRole),
                'string',
                'exists:customers,id',
            ],
            'customer_id' => [
                'nullable',
                Rule::requiredIf($isCustomerRole),
                'string',
                'exists:customers,id',
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'status' => ['required', Rule::enum(UserStatus::class)],
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'phone' => ['nullable', 'string', 'max:20'],
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
            'company_id.required' => 'Company Name is required when the selected role is Customer.',
            'company_id.required_if' => 'Company Name is required when the selected role is Customer.',
            'company_id.exists' => 'The selected company is invalid.',
            'customer_id.required' => 'Company Name is required when the selected role is Customer.',
            'customer_id.required_if' => 'Company Name is required when the selected role is Customer.',
            'customer_id.exists' => 'The selected company is invalid.',
        ];
    }

    /**
     * Custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'company_id' => 'Company Name',
            'customer_id' => 'Company Name',
        ];
    }
}
