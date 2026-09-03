<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ReportType;
use App\Exceptions\BusinessException;
use App\Models\Checkpoint;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\SessionCheckpoint;
use App\Models\TemplateField;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportTemplateService extends BaseService
{
    /**
     * Get all report templates ordered by checkpoint sequence.
     *
     * @return Collection<int, ReportTemplate>
     */
    public function listTemplates(): Collection
    {
        return ReportTemplate::with(['checkpoint', 'templateFields' => function ($query) {
            $query->orderBy('sort_order', 'asc');
        }])
            ->join('checkpoints', 'report_templates.checkpoint_id', '=', 'checkpoints.id')
            ->orderBy('checkpoints.sequence', 'asc')
            ->orderBy('report_templates.created_at', 'desc')
            ->select('report_templates.*')
            ->get();
    }

    /**
     * Create a new ReportTemplate with its associated template fields.
     *
     * @param  array{
     *     checkpoint_id: int,
     *     name: string,
     *     description?: string|null,
     *     applies_to_report_type?: string,
     *     fields: array<int, array{
     *         field_name: string,
     *         field_key?: string|null,
     *         label?: string|null,
     *         field_type: string,
     *         required?: bool,
     *         options?: array<string>|null,
     *         sort_order?: int,
     *     }>,
     * }  $data
     */
    public function createTemplate(array $data): ReportTemplate
    {
        return DB::transaction(function () use ($data) {
            $template = ReportTemplate::create([
                'checkpoint_id'          => $data['checkpoint_id'],
                'name'                   => $data['name'],
                'description'            => $data['description'] ?? null,
                'applies_to_report_type' => $data['applies_to_report_type'] ?? ReportType::Movement->value,
            ]);

            $this->syncTemplateFields($template, $data['fields'] ?? []);

            return $template->load(['checkpoint', 'templateFields']);
        });
    }

    /**
     * Update an existing ReportTemplate and its associated template fields.
     *
     * Note: Existing session checkpoints retain their immutable template_snapshot,
     * so updating master template definition safely applies only to future sessions.
     *
     * @param  array{
     *     checkpoint_id?: int,
     *     name?: string,
     *     description?: string|null,
     *     applies_to_report_type?: string,
     *     fields?: array<int, array{
     *         id?: int|null,
     *         field_name: string,
     *         field_key?: string|null,
     *         label?: string|null,
     *         field_type: string,
     *         required?: bool,
     *         options?: array<string>|null,
     *         sort_order?: int,
     *     }>,
     * }  $data
     */
    public function updateTemplate(ReportTemplate $template, array $data): ReportTemplate
    {
        return DB::transaction(function () use ($template, $data) {
            $updateData = [];
            if (isset($data['checkpoint_id'])) {
                $updateData['checkpoint_id'] = $data['checkpoint_id'];
            }
            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }
            if (array_key_exists('description', $data)) {
                $updateData['description'] = $data['description'];
            }
            if (isset($data['applies_to_report_type'])) {
                $updateData['applies_to_report_type'] = $data['applies_to_report_type'];
            }

            if (!empty($updateData)) {
                $template->update($updateData);
            }

            if (isset($data['fields'])) {
                $this->syncTemplateFields($template, $data['fields']);
            }

            return $template->fresh(['checkpoint', 'templateFields']);
        });
    }

    /**
     * Delete a ReportTemplate if it is completely safe and unreferenced.
     *
     * Strictly blocks deletion if the template has ever been referenced by:
     * 1. Operational Reports in reports table (foreign key constraint)
     * 2. Historical SessionCheckpoints template_snapshot JSON
     *
     * @throws BusinessException
     */
    public function deleteTemplate(ReportTemplate $template): void
    {
        DB::transaction(function () use ($template) {
            // Check 1: Referenced by reports table
            $hasReports = Report::where('report_template_id', $template->id)->exists();
            if ($hasReports) {
                throw new BusinessException(
                    "Template '{$template->name}' tidak dapat dihapus karena sudah digunakan dalam laporan operasional kargo.",
                    422
                );
            }

            // Check 2: Referenced by historical session checkpoint template_snapshot
            $hasCheckpointSnapshots = SessionCheckpoint::whereRaw(
                "template_snapshot->>'template_id' = ?",
                [(string) $template->id]
            )->exists();

            if ($hasCheckpointSnapshots) {
                throw new BusinessException(
                    "Template '{$template->name}' tidak dapat dihapus karena sudah terikat pada snapshot sesi kargo yang pernah dibuat.",
                    422
                );
            }

            // Delete associated template fields first (cascadeOnDelete also in DB)
            $template->templateFields()->delete();

            // Safe to delete master template
            $template->delete();
        });
    }

    /**
     * Synchronize template fields for a ReportTemplate.
     *
     * @param  array<int, array{
     *     id?: int|null,
     *     field_name: string,
     *     field_key?: string|null,
     *     label?: string|null,
     *     field_type: string,
     *     required?: bool,
     *     options?: array<string>|null,
     *     sort_order?: int,
     * }>  $fields
     */
    protected function syncTemplateFields(ReportTemplate $template, array $fields): void
    {
        // Recreate all fields cleanly in order
        $template->templateFields()->delete();

        foreach ($fields as $index => $field) {
            $fieldName = trim($field['field_name']);
            $fieldKey = !empty($field['field_key'])
                ? Str::snake(trim($field['field_key']))
                : Str::snake($fieldName);

            $label = !empty($field['label']) ? trim($field['label']) : $fieldName;

            TemplateField::create([
                'template_id' => $template->id,
                'field_key'   => $fieldKey,
                'field_name'  => $fieldName,
                'label'       => $label,
                'field_type'  => $field['field_type'],
                'required'    => (bool) ($field['required'] ?? false),
                'options'     => !empty($field['options']) ? array_values($field['options']) : null,
                'sort_order'  => (int) ($field['sort_order'] ?? ($index + 1)),
            ]);
        }
    }
}
