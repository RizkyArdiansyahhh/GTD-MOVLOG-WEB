<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\MovementStatus;
use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\SyncStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\SessionUnit;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sesi Pekerja Controller (Web / Inertia)
 *
 * Used by Super Admin to manage heavy equipment work sessions, monitor checkpoints,
 * manage physical movement identities (Tongkang/Truck), and inspect isolated per-movement reports.
 */
class SesiPekerjaController extends Controller
{
    public function __construct(
        private readonly SessionCheckpointService $sessionCheckpointService,
        private readonly MovementService $movementService,
    ) {}

    /**
     * GET /sesi-pekerja
     * Display the heavy equipment work sessions management page for Super Admin.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $fieldWorkers = $this->getActiveFieldWorkers();
        $masterCheckpoints = Checkpoint::orderBy('sequence', 'asc')->get();

        $sessions = ShippingSession::with([
            'sessionCheckpoints.checkpoint',
            'sessionCheckpoints.picUser',
            'currentCheckpoint',
            'units',
        ])
            ->latest()
            ->get()
            ->map(function (ShippingSession $session) use ($masterCheckpoints) {
                $stages = $this->buildFullStagesForSession($session, $masterCheckpoints);

                $activeStage = collect($stages)->firstWhere('status', 'aktif');
                $isDelivered = ($session->status === ShippingSessionStatus::DELIVERED);

                $currentStageName = $isDelivered
                    ? 'Site'
                    : ($activeStage['stage_name'] ?? 'Kapal');

                $petugas = $isDelivered
                    ? (collect($stages)->last()['pic_user']['name'] ?? '-')
                    : ($activeStage['pic_user']['name'] ?? '-');

                $unitSummary = $session->units->isNotEmpty()
                    ? $session->units->map(fn (SessionUnit $u) => $u->unit_name . ($u->quantity > 1 ? " (×{$u->quantity})" : ''))->join(', ')
                    : ($session->cargo_name ?? '-');

                $unitsList = $session->units->isNotEmpty()
                    ? $session->units->map(fn (SessionUnit $u) => [
                        'id'        => (string) $u->id,
                        'unit_name' => $u->unit_name,
                        'quantity'  => (int) $u->quantity,
                        'notes'     => $u->notes,
                    ])->values()->toArray()
                    : [
                        [
                            'id'        => (string) $session->id,
                            'unit_name' => $session->cargo_name ?? '-',
                            'quantity'  => (int) $session->total_quantity,
                            'notes'     => null,
                        ],
                    ];

                return [
                    'id'           => (string) $session->id,
                    'sessionId'    => $session->assignment_no ?? (string) $session->id,
                    'unitName'     => $unitSummary,
                    'currentStage' => $currentStageName,
                    'status'       => $session->status->value,
                    'isDelivered'  => $isDelivered,
                    'petugas'      => $petugas,
                    'createdAt'    => $session->created_at?->format('Y-m-d H:i'),
                    'units'        => $unitsList,
                    'stages'       => $stages,
                    'notes'        => $session->notes,
                ];
            });

        return Inertia::render('KelolaSesi/Index', [
            'fieldWorkers' => $fieldWorkers,
            'sessions'     => $sessions,
        ]);
    }
    /**
     * GET /sesi-pekerja/{session}
     * Display session detail with checkpoint progression stepper and physical movements.
     */
    public function show(Request $request, ShippingSession $session): Response
    {
        $this->authorizeSuperAdmin($request);

        $session->load([
            'sessionCheckpoints.checkpoint',
            'sessionCheckpoints.picUser',
            'currentCheckpoint',
            'units',
        ]);

        $masterCheckpoints = Checkpoint::orderBy('sequence', 'asc')->get();
        $stages = $this->buildFullStagesForSession($session, $masterCheckpoints);

        $fieldWorkers = $this->getActiveFieldWorkers();

        $unitsList = $session->units->isNotEmpty()
            ? $session->units->map(fn (SessionUnit $u) => [
                'id'        => (string) $u->id,
                'unit_name' => $u->unit_name,
                'quantity'  => (int) $u->quantity,
                'notes'     => $u->notes,
            ])->values()->toArray()
            : [
                [
                    'id'        => (string) $session->id,
                    'unit_name' => $session->cargo_name ?? '-',
                    'quantity'  => (int) $session->total_quantity,
                    'notes'     => null,
                ],
            ];

        return Inertia::render('KelolaSesi/Show', [
            'session' => [
                'id'        => (string) $session->id,
                'sessionId' => $session->assignment_no ?? (string) $session->id,
                'status'    => $session->status->value,
                'notes'     => $session->notes,
                'createdAt' => $session->created_at?->format('Y-m-d H:i'),
                'units'     => $unitsList,
                'stages'    => $stages,
            ],
            'fieldWorkers' => $fieldWorkers,
        ]);
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/assign
     * Assign PIC to a session checkpoint.
     */
    public function assignStage(
        Request $request,
        ShippingSession $session,
        SessionCheckpoint $stage,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Checkpoint tidak ditemukan untuk sesi ini.'
        );

        $validated = $request->validate([
            'pic_user_id' => [
                'required',
                'string',
                Rule::exists('users', 'id'),
            ],
            'worker_ids' => ['nullable', 'array'],
        ]);

        try {
            $this->sessionCheckpointService->assignCheckpoint(
                $stage,
                $validated['pic_user_id'],
            );
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        $stageName = $stage->checkpoint?->name ?? 'Checkpoint';

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Assignment ' . $stageName . ' berhasil disimpan.');
    }

    /**
     * POST /sesi-pekerja/{session}/assign-all
     * Batch assign PIC for all session checkpoints at once.
     */
    public function assignAllStages(
        Request $request,
        ShippingSession $session,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'assignments' => ['required', 'array'],
            'assignments.*' => ['nullable', 'string', 'exists:users,id'],
        ]);

        foreach ($validated['assignments'] as $stageId => $picUserId) {
            if (!$picUserId) {
                continue;
            }
            $stage = $session->sessionCheckpoints()->find($stageId);
            if ($stage && $stage->status !== SessionCheckpointStatus::COMPLETED) {
                try {
                    $this->sessionCheckpointService->assignCheckpoint($stage, $picUserId);
                } catch (BusinessException $e) {
                    // Ignore stage that cannot be updated
                }
            }
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Penugasan seluruh petugas PIC berhasil disimpan.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/complete
     * Mark an active session checkpoint as complete.
     */
    public function completeStage(
        Request $request,
        ShippingSession $session,
        SessionCheckpoint $stage,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Checkpoint tidak ditemukan untuk sesi ini.'
        );

        try {
            $this->sessionCheckpointService->completeCheckpoint($stage);
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        $stageName = $stage->checkpoint?->name ?? 'Checkpoint';

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Tahap ' . $stageName . ' berhasil diselesaikan.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/movements
     * Register a new physical movement (Step 1 Tongkang or Step 3 Truck).
     */
    public function storeMovement(
        Request $request,
        ShippingSession $session,
        SessionCheckpoint $stage,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Checkpoint tidak ditemukan untuk sesi ini.'
        );

        $validated = $request->validate([
            'movement_name'      => ['required', 'string', 'max:255'],
            'parent_movement_id' => ['nullable', 'string'],
        ]);

        try {
            $this->movementService->createMovement(
                $session,
                $stage,
                $validated,
                $request->user()->id
            );
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['movement' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Armada fisik berhasil didaftarkan.');
    }

    /**
     * DELETE /sesi-pekerja/{session}/movements/{movement}
     * Delete an unstarted movement.
     */
    public function deleteMovement(
        Request $request,
        ShippingSession $session,
        Movement $movement,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        try {
            $this->movementService->deleteMovement($session, $movement);
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['movement' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Armada berhasil dihapus.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/movements/{movement}/reports
     * Save isolated movement-specific report form values and uploaded photos.
     */
    public function saveReport(
        Request $request,
        ShippingSession $session,
        SessionCheckpoint $stage,
        Movement $movement,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Checkpoint tidak ditemukan untuk sesi ini.'
        );

        $validated = $request->validate([
            'fields'    => ['nullable', 'array'],
            'latitude'  => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'event_at'  => ['nullable', 'date'],
            'photos'    => ['nullable', 'array'],
            'photos.*'  => ['nullable', 'file', 'image', 'max:10240'],
        ]);

        $fieldValues = $validated['fields'] ?? [];
        $photosData = [];

        // Handle direct file uploads keyed by field_key
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $fieldKey => $uploadedFile) {
                if ($uploadedFile && $uploadedFile->isValid()) {
                    $path = $uploadedFile->store('reports/photos', 'public');
                    $photosData[] = [
                        'field_key'  => (string) $fieldKey,
                        'photo_url'  => Storage::disk('public')->url($path),
                        'taken_at'   => Carbon::now(),
                        'sort_order' => 0,
                    ];
                }
            }
        }

        try {
            $this->movementService->saveMovementReportData(
                $session,
                $stage,
                $movement,
                $fieldValues,
                $photosData,
                $request->user()->id,
                isset($validated['latitude']) ? (float) $validated['latitude'] : null,
                isset($validated['longitude']) ? (float) $validated['longitude'] : null,
                !empty($validated['event_at']) ? Carbon::parse($validated['event_at']) : null,
            );
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['report' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Laporan armada berhasil disimpan.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/movements/{movement}/complete-report
     * Mark an isolated movement report as COMPLETED.
     */
    public function completeReport(
        Request $request,
        ShippingSession $session,
        SessionCheckpoint $stage,
        Movement $movement,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Checkpoint tidak ditemukan untuk sesi ini.'
        );

        try {
            $this->movementService->completeMovementReport($session, $stage, $movement);
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['report' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', "Laporan armada '{$movement->movement_name}' berhasil diselesaikan.");
    }

    /**
     * Build the full array of 4 sequential stages (Kapal, Tongkang, Pelabuhan, Site)
     * including resolved physical movements and isolated report instances.
     */
    private function buildFullStagesForSession(ShippingSession $session, $masterCheckpoints): array
    {
        $existingSessionCheckpoints = $session->sessionCheckpoints->keyBy('checkpoint_id');

        $stageTypes = ['kapal', 'tongkang', 'pelabuhan', 'site'];
        $stageLabels = ['Kapal', 'Tongkang', 'Pelabuhan', 'Site'];

        // Parent tongkangs available for Step 3
        $step1Checkpoint = $session->sessionCheckpoints->first(fn ($sc) => $sc->checkpoint?->sequence === 1);
        $availableParentTongkangs = $step1Checkpoint
            ? Movement::where('session_checkpoint_id', $step1Checkpoint->id)->get()->map(fn ($m) => [
                'id'            => (string) $m->id,
                'movement_name' => $m->movement_name,
            ])->toArray()
            : [];

        // Runtime packing list item options from session units
        $packingListOptions = $session->units->isNotEmpty()
            ? $session->units->map(fn ($u) => $u->unit_name . ($u->quantity > 1 ? " ({$u->quantity}x)" : ''))->toArray()
            : (!empty($session->cargo_name) ? [$session->cargo_name] : []);

        return $masterCheckpoints->map(function ($checkpoint, $index) use (
            $session,
            $existingSessionCheckpoints,
            $stageTypes,
            $stageLabels,
            $availableParentTongkangs,
            $packingListOptions
        ) {
            /** @var SessionCheckpoint|null $sc */
            $sc = $existingSessionCheckpoints->get($checkpoint->id);

            if (!$sc) {
                $anyActive = $session->sessionCheckpoints->where('status', SessionCheckpointStatus::IN_PROGRESS)->count() > 0;
                $defaultStatus = ($index === 0 && !$anyActive) ? SessionCheckpointStatus::IN_PROGRESS : SessionCheckpointStatus::PENDING;

                $sc = SessionCheckpoint::create([
                    'shipping_session_id' => $session->id,
                    'checkpoint_id'       => $checkpoint->id,
                    'status'              => $defaultStatus,
                    'sync_status'         => SyncStatus::SYNCED,
                ]);
                $sc->load('checkpoint', 'picUser');
            }

            $statusStr = match ($sc->status) {
                SessionCheckpointStatus::COMPLETED   => 'selesai',
                SessionCheckpointStatus::IN_PROGRESS => 'aktif',
                default                              => 'pending',
            };

            $stageType = $stageTypes[$index] ?? 'kapal';
            $stageName = $stageLabels[$index] ?? ($checkpoint->name ?? 'Tahap ' . ($index + 1));
            $sequence = (int) ($checkpoint->sequence ?? ($index + 1));

            // Resolve physical movements for this stage using MovementService
            $rawMovements = $this->movementService->resolveMovementsForCheckpoint($session, $sc);

            $movementsList = $rawMovements->map(function (Movement $mov) use ($session, $sc) {
                $report = $this->movementService->getReportForMovement($session, $sc, $mov);

                $reportValuesMap = [];
                if ($report) {
                    foreach ($report->reportValues as $rv) {
                        $key = $rv->templateField?->field_key ?? (string) $rv->template_field_id;
                        $reportValuesMap[$key] = $rv->value;
                    }
                }

                $photosList = [];
                if ($report) {
                    foreach ($report->photos as $rp) {
                        $photosList[] = [
                            'id'                => (string) $rp->id,
                            'template_field_id' => $rp->template_field_id,
                            'field_key'         => $rp->templateField?->field_key,
                            'photo_url'         => $rp->photo_url,
                            'caption'           => $rp->caption,
                            'taken_at'          => $rp->taken_at?->format('Y-m-d H:i:s'),
                        ];
                    }
                }

                $reportStatusStr = $report?->status?->value ?? 'not_started';
                $isCompleted = ($report?->status === ReportStatus::COMPLETED);

                return [
                    'id'                 => (string) $mov->id,
                    'movement_name'      => $mov->movement_name,
                    'movement_type'      => $mov->movement_type->value ?? 'transfer',
                    'parent_movement_id' => $mov->parent_movement_id ? (string) $mov->parent_movement_id : null,
                    'parent_name'        => $mov->parentMovement?->movement_name,
                    'sequence'           => (int) $mov->sequence,
                    'status'             => $mov->status->value,
                    'report_status'      => $reportStatusStr,
                    'is_completed'       => $isCompleted,
                    'report'             => $report ? [
                        'id'          => (string) $report->id,
                        'status'      => $report->status->value,
                        'event_at'    => $report->event_at?->format('Y-m-d H:i:s'),
                        'latitude'    => $report->latitude ? (float) $report->latitude : null,
                        'longitude'   => $report->longitude ? (float) $report->longitude : null,
                        'values'      => $reportValuesMap,
                        'photos'      => $photosList,
                    ] : null,
                ];
            })->values()->toArray();

            $completedCount = collect($movementsList)->where('is_completed', true)->count();
            $totalCount = count($movementsList);

            // Inject runtime packing list item options into snapshot fields if present
            $snapshot = $sc->template_snapshot;
            if ($snapshot && isset($snapshot['fields']) && is_array($snapshot['fields'])) {
                foreach ($snapshot['fields'] as &$field) {
                    if (($field['field_key'] ?? '') === 'packing_list_item' && empty($field['options'])) {
                        $field['options'] = $packingListOptions;
                    }
                }
            }

            return [
                'id'                       => (string) $sc->id,
                'stage_type'               => $stageType,
                'stage_name'               => $stageName,
                'stage_order'              => $sequence,
                'status'                   => $statusStr,
                'can_add_movement'         => ($sequence === 1 || $sequence === 3),
                'movement_label'           => ($sequence === 1 || $sequence === 2) ? 'Tongkang / LCT' : 'Armada Truk',
                'completed_movement_count' => $completedCount,
                'total_movement_count'     => $totalCount,
                'is_ready_to_complete'     => ($totalCount > 0 && $completedCount === $totalCount),
                'template_snapshot'        => $snapshot,
                'available_parents'        => ($sequence === 3) ? $availableParentTongkangs : [],
                'movements'                => $movementsList,
                'pic_user'                 => $sc->picUser ? [
                    'id'    => (string) $sc->picUser->id,
                    'name'  => $sc->picUser->name,
                    'email' => $sc->picUser->email,
                ] : null,
                'workers'                  => $sc->picUser ? [
                    [
                        'id'    => (string) $sc->picUser->id,
                        'name'  => $sc->picUser->name,
                        'email' => $sc->picUser->email,
                    ],
                ] : [],
                'notes'                    => null,
                'started_at'               => $sc->actual_start?->toISOString(),
                'completed_at'             => $sc->actual_finish?->toISOString(),
            ];
        })->values()->toArray();
    }

    /**
     * Authorize that the current user has the Super Admin role.
     */
    private function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();

        $hasAccess = $user && (
            $user->hasRole(UserRole::SuperAdmin->value) ||
            $user->hasRole('super-admin') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('Super-Admin') ||
            $user->hasRole('staff') ||
            $user->hasRole('Staff')
        );

        if (!$hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke halaman Kelola Sesi Pekerja.');
        }
    }

    /**
     * Fetch active users with the role 'field-worker' from the database.
     */
    private function getActiveFieldWorkers()
    {
        $fieldWorkerRoles = [
            UserRole::FieldWorker->value,
            'field-worker',
            'Field Worker',
            'field_worker',
            'fieldworker',
        ];

        $workers = User::whereHas('roles', function ($query) use ($fieldWorkerRoles) {
            $query->whereIn('name', $fieldWorkerRoles)
                  ->orWhereRaw('LOWER(name) IN (?, ?, ?, ?)', ['field-worker', 'field worker', 'field_worker', 'fieldworker']);
        })->get();

        if ($workers->isEmpty()) {
            $workers = User::where(function ($q) {
                $q->whereRaw('LOWER(email) LIKE ?', ['%fieldworker%'])
                  ->orWhereRaw('LOWER(name) LIKE ?', ['%field worker%'])
                  ->orWhereRaw('LOWER(email) LIKE ?', ['%worker%']);
            })->get();
        }

        return $workers->filter(function ($worker) {
            $statusVal = is_object($worker->status) ? $worker->status->value : (string) $worker->status;
            return strtolower($statusVal) !== 'inactive' && strtolower($statusVal) !== 'tidak aktif';
        })
        ->values()
        ->map(function ($worker) {
            return [
                'id'           => (string) $worker->id,
                'name'         => $worker->name,
                'email'        => $worker->email,
                'phone'        => $worker->phone,
                'employee_id'  => $worker->phone ? 'ID: ' . $worker->phone : null,
                'role_label'   => 'Field Worker',
                'status_label' => 'Active',
            ];
        });
    }

    /**
     * Get a default customer ID for session creation.
     */
    private function getDefaultCustomerId(): string
    {
        $customer = Customer::first();

        if (!$customer) {
            $customer = Customer::create([
                'company_name' => 'Default Customer',
            ]);
        }

        return (string) $customer->id;
    }
}