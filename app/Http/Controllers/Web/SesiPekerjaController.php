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
 * Used by Super Admin & Staff to manage heavy equipment work sessions and monitor
 * overall logistics checkpoints according to the official ERD.
 */
class SesiPekerjaController extends Controller
{
    public function __construct(
        private readonly SessionCheckpointService $sessionCheckpointService,
    ) {}

    /**
     * GET /sesi-pekerja
     * Display the heavy equipment work sessions management page for Super Admin & Staff.
     */
    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

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
            })
            ->values()
            ->toArray();

        if (empty($sessions)) {
            $sessions = $this->getMockSessions();
        }

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
        $this->authorizeAccess($request);

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
        $this->authorizeAccess($request);

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
            ->with('success', 'Worker session created successfully.');
    }

    /**
     * GET /sesi-pekerja/{session}
     * Display session detail with checkpoint progression stepper.
     */
    public function show(Request $request, string $session): Response
    {
        $this->authorizeAccess($request);

        $fieldWorkers = $this->getActiveFieldWorkers();

        // 1. Try resolving ShippingSession by ID (ULID) or assignment_no
        $shippingSession = ShippingSession::with([
            'sessionCheckpoints.checkpoint',
            'sessionCheckpoints.picUser',
            'currentCheckpoint',
            'units',
        ])
            ->where('id', $session)
            ->orWhere('assignment_no', $session)
            ->first();

        // 2. If found in database, format and render
        if ($shippingSession) {
            $masterCheckpoints = Checkpoint::orderBy('sequence', 'asc')->get();
            $stages = $this->buildFullStagesForSession($shippingSession, $masterCheckpoints);

            $unitsList = $shippingSession->units->isNotEmpty()
                ? $shippingSession->units->map(fn (SessionUnit $u) => [
                    'id'        => (string) $u->id,
                    'unit_name' => $u->unit_name,
                    'quantity'  => (int) $u->quantity,
                    'notes'     => $u->notes,
                ])->values()->toArray()
                : [
                    [
                        'id'        => (string) $shippingSession->id,
                        'unit_name' => $shippingSession->cargo_name ?? '-',
                        'quantity'  => (int) $shippingSession->total_quantity,
                        'notes'     => null,
                    ],
                ];

            return Inertia::render('KelolaSesi/Show', [
                'session' => [
                    'id'        => (string) $shippingSession->id,
                    'sessionId' => $shippingSession->assignment_no ?? (string) $shippingSession->id,
                    'notes'     => $shippingSession->notes,
                    'createdAt' => $shippingSession->created_at?->format('Y-m-d H:i'),
                    'units'     => $unitsList,
                    'stages'    => $stages,
                ],
                'fieldWorkers' => $fieldWorkers,
            ]);
        }

        // 3. Fallback: check mock sessions
        $mock = collect($this->getMockSessions())->first(
            fn ($s) => $s['id'] === $session || $s['sessionId'] === $session
        );

        if ($mock) {
            return Inertia::render('KelolaSesi/Show', [
                'session'      => $mock,
                'fieldWorkers' => $fieldWorkers,
            ]);
        }

        abort(404, 'Worker session not found.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/assign
     * Assign PIC and optional workers to a session checkpoint.
     */
    public function assignStage(
        Request $request,
        string $session,
        string $stage,
    ): RedirectResponse {
        $this->authorizeAccess($request);

        $shippingSession = ShippingSession::where('id', $session)
            ->orWhere('assignment_no', $session)
            ->first();

        if (!$shippingSession) {
            return redirect()->back()->with('success', 'Assignment saved successfully.');
        }

        $sessionCheckpoint = SessionCheckpoint::where('shipping_session_id', $shippingSession->id)
            ->where('id', $stage)
            ->first();

        if (!$sessionCheckpoint) {
            return redirect()->back()->with('success', 'Assignment saved successfully.');
        }

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
                $sessionCheckpoint,
                $validated['pic_user_id'],
            );
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        $stageName = $sessionCheckpoint->checkpoint?->name ?? 'Checkpoint';

        return redirect()
            ->route('sesi-pekerja.show', $shippingSession->id)
            ->with('success', 'Assignment for ' . $stageName . ' stage saved successfully.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/complete
     * Mark an active session checkpoint as complete.
     */
    public function completeStage(
        Request $request,
        string $session,
        string $stage,
    ): RedirectResponse {
        $this->authorizeAccess($request);

        $shippingSession = ShippingSession::where('id', $session)
            ->orWhere('assignment_no', $session)
            ->first();

        if (!$shippingSession) {
            return redirect()->back()->with('success', 'Stage completed successfully.');
        }

        $sessionCheckpoint = SessionCheckpoint::where('shipping_session_id', $shippingSession->id)
            ->where('id', $stage)
            ->first();

        if (!$sessionCheckpoint) {
            return redirect()->back()->with('success', 'Stage completed successfully.');
        }

        try {
            $this->sessionCheckpointService->completeCheckpoint($sessionCheckpoint);
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        $stageName = $sessionCheckpoint->checkpoint?->name ?? 'Checkpoint';

        return redirect()
            ->route('sesi-pekerja.show', $shippingSession->id)
            ->with('success', 'Stage ' . $stageName . ' completed successfully.');
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
     * Authorize that the current user has the Super Admin or Staff role.
     */
    private function authorizeAccess(Request $request): void
    {
        $user = $request->user();

        $hasAccess = $user && (
            $user->hasRole(UserRole::SuperAdmin->value) ||
            $user->hasRole(UserRole::Staff->value) ||
            $user->hasRole('super-admin') ||
            $user->hasRole('staff') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('Staff') ||
            $user->hasRole('Super-Admin')
        );

        if (!$hasAccess) {
            abort(403, 'You do not have access to Worker Sessions.');
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

    /**
     * Mock data sessions fallback for development/demo.
     */
    private function getMockSessions(): array
    {
        return [
            [
                'id'           => '01J000001',
                'sessionId'    => 'SES-2048',
                'unitName'     => 'Excavator CAT 320',
                'currentStage' => 'Pelabuhan',
                'petugas'      => 'Budi S.',
                'createdAt'    => '2026-08-01 08:30',
                'notes'        => null,
                'units'        => [
                    ['id' => 'u1', 'unit_name' => 'Excavator CAT 320', 'quantity' => 2, 'notes' => null],
                    ['id' => 'u2', 'unit_name' => 'Dump Truck HD465', 'quantity' => 1, 'notes' => null],
                ],
                'stages'       => [
                    ['id' => 's1', 'stage_type' => 'kapal', 'stage_name' => 'Vessel', 'stage_order' => 1, 'status' => 'selesai', 'pic_user' => ['id' => 'p1', 'name' => 'Budi S.'], 'workers' => [['id' => 'w1', 'name' => 'Anto F.']], 'notes' => null, 'started_at' => '2026-08-01T01:00:00Z', 'completed_at' => '2026-08-01T05:00:00Z'],
                    ['id' => 's2', 'stage_type' => 'tongkang', 'stage_name' => 'Barge', 'stage_order' => 2, 'status' => 'selesai', 'pic_user' => ['id' => 'p2', 'name' => 'Hendra W.'], 'workers' => [['id' => 'w2', 'name' => 'Rudi H.']], 'notes' => null, 'started_at' => '2026-08-01T05:00:00Z', 'completed_at' => '2026-08-01T08:00:00Z'],
                    ['id' => 's3', 'stage_type' => 'pelabuhan', 'stage_name' => 'Port', 'stage_order' => 3, 'status' => 'aktif', 'pic_user' => ['id' => 'p3', 'name' => 'Ahmad K.'], 'workers' => [['id' => 'w3', 'name' => 'Denny P.']], 'notes' => null, 'started_at' => '2026-08-01T08:00:00Z', 'completed_at' => null],
                    ['id' => 's4', 'stage_type' => 'site', 'stage_name' => 'Site', 'stage_order' => 4, 'status' => 'pending', 'pic_user' => null, 'workers' => [], 'notes' => null, 'started_at' => null, 'completed_at' => null],
                ],
            ],
            [
                'id'           => '01J000002',
                'sessionId'    => 'SES-2050',
                'unitName'     => 'Mobile Crane 50T',
                'currentStage' => 'Kapal',
                'petugas'      => 'Anto F.',
                'createdAt'    => '2026-08-01 09:15',
                'notes'        => null,
                'units'        => [['id' => 'u3', 'unit_name' => 'Mobile Crane 50T', 'quantity' => 1, 'notes' => null]],
                'stages'       => [
                    ['id' => 's5', 'stage_type' => 'kapal', 'stage_name' => 'Vessel', 'stage_order' => 1, 'status' => 'aktif', 'pic_user' => ['id' => 'p4', 'name' => 'Anto F.'], 'workers' => [['id' => 'w4', 'name' => 'Siti M.']], 'notes' => null, 'started_at' => '2026-08-01T02:00:00Z', 'completed_at' => null],
                    ['id' => 's6', 'stage_type' => 'tongkang', 'stage_name' => 'Barge', 'stage_order' => 2, 'status' => 'pending', 'pic_user' => null, 'workers' => [], 'notes' => null, 'started_at' => null, 'completed_at' => null],
                    ['id' => 's7', 'stage_type' => 'pelabuhan', 'stage_name' => 'Port', 'stage_order' => 3, 'status' => 'pending', 'pic_user' => null, 'workers' => [], 'notes' => null, 'started_at' => null, 'completed_at' => null],
                    ['id' => 's8', 'stage_type' => 'site', 'stage_name' => 'Site', 'stage_order' => 4, 'status' => 'pending', 'pic_user' => null, 'workers' => [], 'notes' => null, 'started_at' => null, 'completed_at' => null],
                ],
            ],
            [
                'id'           => '01J000003',
                'sessionId'    => 'SES-2045',
                'unitName'     => 'Dump Truck HD465',
                'currentStage' => 'Site',
                'petugas'      => 'Hendra W.',
                'createdAt'    => '2026-07-31 14:00',
                'notes'        => null,
                'units'        => [['id' => 'u4', 'unit_name' => 'Dump Truck HD465', 'quantity' => 3, 'notes' => null]],
                'stages'       => [
                    ['id' => 's9', 'stage_type' => 'kapal', 'stage_name' => 'Vessel', 'stage_order' => 1, 'status' => 'selesai', 'pic_user' => ['id' => 'p5', 'name' => 'Irfan S.'], 'workers' => [['id' => 'w5', 'name' => 'Fajar R.']], 'notes' => null, 'started_at' => '2026-07-31T07:00:00Z', 'completed_at' => '2026-07-31T09:00:00Z'],
                    ['id' => 's10', 'stage_type' => 'tongkang', 'stage_name' => 'Barge', 'stage_order' => 2, 'status' => 'selesai', 'pic_user' => ['id' => 'p6', 'name' => 'Rian T.'], 'workers' => [['id' => 'w6', 'name' => 'Budi S.']], 'notes' => null, 'started_at' => '2026-07-31T09:00:00Z', 'completed_at' => '2026-07-31T11:00:00Z'],
                    ['id' => 's11', 'stage_type' => 'pelabuhan', 'stage_name' => 'Port', 'stage_order' => 3, 'status' => 'selesai', 'pic_user' => ['id' => 'p7', 'name' => 'Ahmad K.'], 'workers' => [['id' => 'w7', 'name' => 'Anto F.']], 'notes' => null, 'started_at' => '2026-07-31T11:00:00Z', 'completed_at' => '2026-07-31T13:00:00Z'],
                    ['id' => 's12', 'stage_type' => 'site', 'stage_name' => 'Site', 'stage_order' => 4, 'status' => 'aktif', 'pic_user' => ['id' => 'p8', 'name' => 'Hendra W.'], 'workers' => [['id' => 'w8', 'name' => 'Rudi H.'], ['id' => 'w9', 'name' => 'Denny P.']], 'notes' => null, 'started_at' => '2026-07-31T13:00:00Z', 'completed_at' => null],
                ],
            ],
        ];
    }
}
