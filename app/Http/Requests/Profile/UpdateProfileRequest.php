<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Profile Request
 *
 * Handles validation for internal user profile updates.
 * Security Decision: email, roles, permissions, and status are strictly omitted and not processable.
 */
class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
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
            'name.required' => 'Full name is required.',
            'name.max'      => 'Full name may not exceed 255 characters.',
            'phone.max'     => 'Phone number may not exceed 20 characters.',
            'avatar.image'  => 'Profile photo must be an image file.',
            'avatar.mimes'  => 'Profile photo must be in JPG, PNG, or WEBP format.',
            'avatar.max'    => 'Profile photo size may not exceed 2MB.',
        ];
    }
}
