<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveDocumentStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Decode string JSON document_data menjadi array sebelum validasi dijalankan.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->document_data)) {
            $decoded = json_decode($this->document_data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge([
                    'document_data' => $decoded,
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'assignment_no_ref' => ['required', 'string'],
            'customer_id'       => ['required', 'string', 'exists:customers,id'],
            'document_type_id'  => ['required', 'string', 'exists:document_types,id'],
            'document_data'     => ['required', 'array'],
            'file_name'         => ['nullable', 'string'],
            'file_path'         => ['nullable', 'string'],
            'pdf'               => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
