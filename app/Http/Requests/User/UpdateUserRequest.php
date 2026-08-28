<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Update User Request
 *
 * Handles validation for updating an existing user.
 */
class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $userParam = $this->route('user');
        $user = $userParam instanceof \App\Models\User
            ? $userParam
            : \App\Models\User::findOrFail($userParam);

        return $this->user()->can('update', $user);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userParam = $this->route('user');
        $userId = $userParam instanceof \App\Models\User ? $userParam->id : $userParam;

        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'status'   => ['required', Rule::enum(UserStatus::class)],
            'role'     => ['nullable', Rule::enum(UserRole::class)],
            'phone'    => ['nullable', 'string', 'max:20'],
        ];
    }
}
