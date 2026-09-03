<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportTemplateRequest;
use App\Http\Requests\UpdateReportTemplateRequest;
use App\Models\Checkpoint;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\SessionCheckpoint;
use App\Services\ReportTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportTemplateController extends Controller
{
    public function __construct(
        protected ReportTemplateService $reportTemplateService
    ) {}

    /**
     * Display a listing of master report templates.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $templates = $this->reportTemplateService->listTemplates()->map(function (ReportTemplate $template) {
            $fieldsCount = $template->templateFields->where('field_type', '!=', 'photo')->count();
            $photoSlotsCount = $template->templateFields->where('field_type', 'photo')->count();

            // Check if this template is currently used by any operational reports or session snapshots
            $isUsedInReports = Report::where('report_template_id', $template->id)->exists();
            $isUsedInSnapshots = SessionCheckpoint::whereRaw(
                "template_snapshot->>'template_id' = ?",
                [(string) $template->id]
            )->exists();

            return [
                'id'                     => $template->id,
                'name'                   => $template->name,
                'description'            => $template->description,
                'checkpoint_id'          => $template->checkpoint_id,
                'checkpoint_name'        => $template->checkpoint?->name,
                'checkpoint_sequence'    => $template->checkpoint?->sequence,
                'applies_to_report_type' => $template->applies_to_report_type?->value ?? 'movement',
                'fields_count'           => $fieldsCount,
                'photo_slots_count'      => $photoSlotsCount,
                'total_fields_count'     => $template->templateFields->count(),
                'is_used'                => ($isUsedInReports || $isUsedInSnapshots),
                'created_at'             => $template->created_at?->format('Y-m-d H:i'),
                'updated_at'             => $template->updated_at?->format('Y-m-d H:i'),
            ];
        });

        $checkpoints = Checkpoint::orderBy('sequence', 'asc')
            ->get(['id', 'name', 'sequence']);

        return Inertia::render('TemplateLaporan/Index', [
            'templates'   => $templates,
            'checkpoints' => $checkpoints,
        ]);
    }

    /**
     * Show the form for creating a new master report template.
     */
    public function create(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $checkpoints = Checkpoint::orderBy('sequence', 'asc')
            ->get(['id', 'name', 'sequence']);

        return Inertia::render('TemplateLaporan/Create', [
            'checkpoints' => $checkpoints,
        ]);
    }

    /**
     * Store a newly created master report template in storage.
     */
    public function store(StoreReportTemplateRequest $request): RedirectResponse
    {
        $this->reportTemplateService->createTemplate($request->validated());

        return redirect()
            ->route('template-laporan.index')
            ->with('success', 'Template laporan berhasil ditambahkan.');
    }

    /**
     * Show the form for editing the specified master report template.
     */
    public function edit(Request $request, ReportTemplate $templateLaporan): Response
    {
        $this->authorizeSuperAdmin($request);

        $templateLaporan->load([
            'checkpoint',
            'templateFields' => function ($q) {
                $q->orderBy('sort_order', 'asc');
            },
        ]);

        $checkpoints = Checkpoint::orderBy('sequence', 'asc')
            ->get(['id', 'name', 'sequence']);

        $fields = $templateLaporan->templateFields->map(function ($field) {
            return [
                'id'         => $field->id,
                'field_name' => $field->field_name,
                'field_key'  => $field->field_key,
                'label'      => $field->label,
                'field_type' => $field->field_type,
                'required'   => (bool) $field->required,
                'options'    => $field->options ?? [],
                'sort_order' => (int) $field->sort_order,
            ];
        });

        return Inertia::render('TemplateLaporan/Edit', [
            'template' => [
                'id'                     => $templateLaporan->id,
                'name'                   => $templateLaporan->name,
                'description'            => $templateLaporan->description,
                'checkpoint_id'          => $templateLaporan->checkpoint_id,
                'checkpoint_name'        => $templateLaporan->checkpoint?->name,
                'applies_to_report_type' => $templateLaporan->applies_to_report_type?->value ?? 'movement',
                'fields'                 => $fields,
            ],
            'checkpoints' => $checkpoints,
        ]);
    }

    /**
     * Update the specified master report template in storage.
     */
    public function update(
        UpdateReportTemplateRequest $request,
        ReportTemplate $templateLaporan
    ): RedirectResponse {
        $this->reportTemplateService->updateTemplate(
            $templateLaporan,
            $request->validated()
        );

        return redirect()
            ->route('template-laporan.index')
            ->with('success', 'Master template laporan berhasil diperbarui.');
    }

    /**
     * Remove the specified master report template from storage if safe.
     */
    public function destroy(
        Request $request,
        ReportTemplate $templateLaporan
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        try {
            $this->reportTemplateService->deleteTemplate($templateLaporan);

            return redirect()
                ->route('template-laporan.index')
                ->with('success', "Template '{$templateLaporan->name}' berhasil dihapus.");
        } catch (BusinessException $e) {
            return redirect()
                ->route('template-laporan.index')
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Authorize that the current user has the Super Admin role.
     */
    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        $hasSuperAdminRole = $user && (
            $user->hasRole(UserRole::SuperAdmin->value) ||
            $user->hasRole('super-admin') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('Super-Admin')
        );

        if (!$hasSuperAdminRole) {
            abort(403, 'Hanya Super Admin yang berhak mengelola master template laporan.');
        }
    }
}
