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

        // Normalize literal "null"/"undefined"/empty strings to null so
        // `required` fails instead of persisting the string "null".
        foreach (['assignment_no_ref', 'customer_id', 'document_type_id', 'file_name', 'file_path'] as $key) {
            $val = $this->input($key);
            if (is_string($val) && in_array(strtolower(trim($val)), ['null', 'undefined', ''], true)) {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'assignment_no_ref' => ['required', 'string', 'min:3', 'not_in:null,NULL,undefined', 'regex:/^(?!null$)(?!undefined$).+/i'],
            'customer_id'       => ['required', 'string', 'exists:customers,id'],
            'document_type_id'  => ['required', 'string', 'exists:document_types,id'],
            'document_data'     => ['required', 'array'],
            'file_name'         => ['nullable', 'string'],
            'file_path'         => ['nullable', 'string'],
            'pdf'               => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'assignment_no_ref.not_in' => 'Assignment reference tidak valid.',
            'assignment_no_ref.regex' => 'Assignment reference tidak valid.',
        ];
    }
}
