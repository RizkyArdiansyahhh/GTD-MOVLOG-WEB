<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\SyncStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\SessionCheckpoint;
use App\Models\SessionUnit;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\SessionCheckpointService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sesi Pekerja Controller (Web / Inertia)
 *
 * Used by Super Admin to manage heavy equipment work sessions and monitor
 * overall logistics checkpoints according to the official ERD.
 */
class SesiPekerjaController extends Controller
{
    public function __construct(
        private readonly SessionCheckpointService $sessionCheckpointService,
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

        // Load sessions with session checkpoints, current checkpoint, and units
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

                $currentStageName = $activeStage['stage_name']
                    ?? ($session->status === ShippingSessionStatus::DELIVERED ? 'Site' : 'Kapal');

                $petugas = $activeStage['pic_user']['name'] ?? '-';

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
     * GET /sesi-pekerja/tambah
     * Display the form page for creating a new heavy equipment session.
     */
    public function create(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $fieldWorkers = $this->getActiveFieldWorkers();

        return Inertia::render('KelolaSesi/Create', [
            'fieldWorkers' => $fieldWorkers,
        ]);
    }

    /**
     * POST /sesi-pekerja
     * Store a new session and initialize checkpoint progression.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'id_sesi'            => ['required', 'string', 'max:50'],
            'notes'              => ['nullable', 'string', 'max:1000'],

            // Units list
            'units'              => ['required', 'array', 'min:1'],
            'units.*.unit_name'  => ['required', 'string', 'max:255'],
            'units.*.quantity'   => ['required', 'integer', 'min:1'],

            // Kapal checkpoint PIC assignment
            'kapal_pic_user_id'  => [
                'required',
                'string',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('status', UserStatus::Active->value);
                }),
            ],
            'kapal_worker_ids'   => ['nullable', 'array'],
        ]);

        $firstUnitName = $validated['units'][0]['unit_name'] ?? 'Unit';
        $joinedUnitNames = collect($validated['units'])->pluck('unit_name')->join(', ');
        $totalQuantity = collect($validated['units'])->sum('quantity');

        // Create shipping session
        $session = ShippingSession::create([
            'assignment_no'  => $validated['id_sesi'],
            'cargo_name'     => $joinedUnitNames ?: $firstUnitName,
            'total_quantity' => $totalQuantity,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
            'notes'          => $validated['notes'] ?? null,
            'created_by'     => $request->user()->id,
            'customer_id'    => $this->getDefaultCustomerId(),
        ]);

        // Create SessionUnit rows for all units
        foreach ($validated['units'] as $unitData) {
            SessionUnit::create([
                'shipping_session_id' => $session->id,
                'unit_name'           => trim((string) $unitData['unit_name']),
                'quantity'            => (int) $unitData['quantity'],
                'notes'               => null,
            ]);
        }

        // Initialize session checkpoints (Kapal -> Tongkang -> Pelabuhan -> Site)
        $this->sessionCheckpointService->createCheckpointsForSession($session, [
            'pic_user_id' => $validated['kapal_pic_user_id'],
        ]);

        return redirect()
            ->route('sesi-pekerja')
            ->with('success', 'Sesi pekerja berhasil dibuat.');
    }

    /**
     * GET /sesi-pekerja/{session}
     * Display session detail with checkpoint progression stepper.
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
     * Assign PIC and optional workers to a session checkpoint.
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
     * Build the full array of 4 sequential stages (Kapal, Tongkang, Pelabuhan, Site)
     * ensuring no stage is skipped even if some records were missing from older sessions.
     */
    private function buildFullStagesForSession(ShippingSession $session, $masterCheckpoints): array
    {
        $existingSessionCheckpoints = $session->sessionCheckpoints->keyBy('checkpoint_id');

        $stageTypes = ['kapal', 'tongkang', 'pelabuhan', 'site'];
        $stageLabels = ['Kapal', 'Tongkang', 'Pelabuhan', 'Site'];

        return $masterCheckpoints->map(function ($checkpoint, $index) use ($session, $existingSessionCheckpoints, $stageTypes, $stageLabels) {
            /** @var SessionCheckpoint|null $sc */
            $sc = $existingSessionCheckpoints->get($checkpoint->id);

            if (!$sc) {
                // Determine if this should be in_progress (if first and no other is active) or pending
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

            return [
                'id'           => (string) $sc->id,
                'stage_type'   => $stageType,
                'stage_name'   => $stageName,
                'stage_order'  => (int) ($checkpoint->sequence ?? ($index + 1)),
                'status'       => $statusStr,
                'pic_user'     => $sc->picUser ? [
                    'id'    => (string) $sc->picUser->id,
                    'name'  => $sc->picUser->name,
                    'email' => $sc->picUser->email,
                ] : null,
                'workers'      => $sc->picUser ? [
                    [
                        'id'    => (string) $sc->picUser->id,
                        'name'  => $sc->picUser->name,
                        'email' => $sc->picUser->email,
                    ],
                ] : [],
                'notes'        => null,
                'started_at'   => $sc->actual_start?->toISOString(),
                'completed_at' => $sc->actual_finish?->toISOString(),
            ];
        })->values()->toArray();
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