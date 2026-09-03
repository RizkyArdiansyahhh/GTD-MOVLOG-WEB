<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ReportType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && (
            $user->hasRole(UserRole::SuperAdmin->value) ||
            $user->hasRole('super-admin') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('Super-Admin')
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'checkpoint_id'          => ['required', 'integer', 'exists:checkpoints,id'],
            'name'                   => ['required', 'string', 'max:255'],
            'description'            => ['nullable', 'string'],
            'applies_to_report_type' => ['nullable', 'string', Rule::enum(ReportType::class)],
            'fields'                 => ['required', 'array', 'min:1'],
            'fields.*.field_name'    => ['required', 'string', 'max:255'],
            'fields.*.field_key'     => ['nullable', 'string', 'max:255'],
            'fields.*.label'         => ['nullable', 'string', 'max:255'],
            'fields.*.field_type'    => ['required', 'string', 'in:text,number,dropdown,date,photo'],
            'fields.*.required'      => ['nullable', 'boolean'],
            'fields.*.options'       => ['nullable', 'array'],
            'fields.*.options.*'     => ['string', 'max:255'],
            'fields.*.sort_order'    => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'checkpoint_id.required'       => 'Tahapan checkpoint wajib dipilih.',
            'checkpoint_id.exists'         => 'Tahapan checkpoint tidak valid.',
            'name.required'                => 'Nama template laporan wajib diisi.',
            'fields.required'              => 'Minimal 1 field atau foto wajib ditambahkan.',
            'fields.min'                   => 'Minimal 1 field atau foto wajib ditambahkan.',
            'fields.*.field_name.required' => 'Nama setiap field wajib diisi.',
            'fields.*.field_type.required' => 'Tipe field wajib dipilih.',
            'fields.*.field_type.in'       => 'Tipe field tidak valid (harus text, number, dropdown, date, atau photo).',
        ];
    }
}
