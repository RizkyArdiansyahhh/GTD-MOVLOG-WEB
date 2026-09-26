<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

class GenerateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        // Support legacy parameter names: date_from, date_to
        if (!$this->has('start_date') && $this->has('date_from')) {
            $merge['start_date'] = $this->input('date_from');
        }
        if (!$this->has('end_date') && $this->has('date_to')) {
            $merge['end_date'] = $this->input('date_to');
        }

        // Legacy alias: xlsx is served by the excel exporter.
        if ($this->input('format') === 'xlsx') {
            $merge['format'] = 'excel';
        }

        // Preview calls omit format; default to pdf so the same
        // request class can serve both preview and export.
        if (!$this->filled('format')) {
            $merge['format'] = 'pdf';
        }

        // Normalize customer_id: treat empty string or 'all'/'semua' as null
        if ($this->has('customer_id')) {
            $val = trim((string) $this->input('customer_id'));
            $merge['customer_id'] = ($val === '' || in_array(strtolower($val), ['all', 'semua'], true)) ? null : $val;
        }

        // Normalize status: treat empty string or 'all'/'semua' as null, otherwise lowercase
        if ($this->has('status')) {
            $val = trim((string) $this->input('status'));
            $merge['status'] = ($val === '' || in_array(strtolower($val), ['all', 'semua'], true)) ? null : strtolower($val);
        }

        // Normalize search
        if ($this->has('search')) {
            $val = trim((string) $this->input('search'));
            $merge['search'] = $val === '' ? null : $val;
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'start_date'     => ['required', 'date'],
            'end_date'       => ['required', 'date', 'after_or_equal:start_date'],
            'customer_id'    => ['nullable', 'exists:customers,id'],
            'status'         => ['nullable', 'string'],
            'search'         => ['nullable', 'string', 'max:255'],
            'sort_by'        => ['nullable', 'string', 'in:created_at,assignment_no,status,cargo_name'],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc'],
            'format'         => ['required', 'in:pdf,excel'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.required'     => 'Tanggal mulai wajib diisi.',
            'end_date.required'       => 'Tanggal akhir wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal akhir harus sama atau setelah tanggal mulai.',
            'customer_id.exists'      => 'Customer yang dipilih tidak valid.',
            'format.required'         => 'Format export wajib dipilih.',
            'format.in'               => 'Format hanya boleh pdf atau excel.',
        ];
    }
}
