<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Models\SessionStage;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\SessionStageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sesi Pekerja Controller (Web / Inertia)
 *
 * Used by Super Admin to manage heavy equipment work sessions and monitor
 * overall logistics progress before entering checkpoint monitoring.
 */
class SesiPekerjaController extends Controller
{
    public function __construct(
        private readonly SessionStageService $sessionStageService,
    ) {}

    /**
     * GET /sesi-pekerja
     * Display the heavy equipment work sessions management page for Super Admin.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $fieldWorkers = $this->getActiveFieldWorkers();

        // Load sessions with stages, units, and active stage PIC
        $sessions = ShippingSession::with([
            'stages.picUser',
            'stages.workers',
            'units',
        ])
            ->latest()
            ->get()
            ->map(function (ShippingSession $session) {
                $activeStage = $session->stages->firstWhere('status', \App\Enums\StageStatus::Aktif);
                $firstUnit = $session->units->first();
                $unitCount = $session->units->count();

                return [
                    'id'           => (string) $session->id,
                    'sessionId'    => $session->assignment_no ?? (string) $session->id,
                    'unitName'     => $firstUnit
                        ? $firstUnit->unit_name . ($unitCount > 1 ? ' +' . ($unitCount - 1) . ' lainnya' : '')
                        : ($session->cargo_name ?? '-'),
                    'currentStage' => $activeStage ? ucfirst($activeStage->stage_type->value) : 'Site',
                    'petugas'      => $activeStage && $activeStage->picUser
                        ? $activeStage->picUser->name
                        : '-',
                    'createdAt'    => $session->created_at?->format('Y-m-d H:i'),
                    'units'        => $session->units->map(fn ($u) => [
                        'id'        => (string) $u->id,
                        'unit_name' => $u->unit_name,
                        'quantity'  => $u->quantity,
                        'notes'     => $u->notes,
                    ])->values(),
                    'stages'       => $session->stages->map(fn ($s) => [
                        'id'           => (string) $s->id,
                        'stage_type'   => $s->stage_type->value,
                        'stage_order'  => $s->stage_order,
                        'status'       => $s->status->value,
                        'pic_user'     => $s->picUser ? [
                            'id'   => (string) $s->picUser->id,
                            'name' => $s->picUser->name,
                        ] : null,
                        'workers'      => $s->workers->map(fn ($w) => [
                            'id'   => (string) $w->id,
                            'name' => $w->name,
                        ])->values(),
                        'started_at'   => $s->started_at?->toISOString(),
                        'completed_at' => $s->completed_at?->toISOString(),
                    ])->values(),
                    'notes'        => null,
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
     * Store a new session with units and kapal stage assignment.
     * Redirects to the Index page so the newly created session appears in the list.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'id_sesi'            => ['required', 'string', 'max:50'],
            'notes'              => ['nullable', 'string', 'max:1000'],

            // Units: at least one unit required
            'units'              => ['required', 'array', 'min:1'],
            'units.*.unit_name'  => ['required', 'string', 'max:255'],
            'units.*.quantity'   => ['required', 'integer', 'min:1'],

            // Kapal stage assignment: required
            'kapal_pic_user_id'  => [
                'required',
                'string',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('status', UserStatus::Active->value);
                }),
            ],
            'kapal_worker_ids'   => ['required', 'array', 'min:1'],
            'kapal_worker_ids.*' => [
                'required',
                'string',
                Rule::exists('users', 'id'),
            ],
        ]);

        // Create session
        $session = ShippingSession::create([
            'assignment_no'  => $validated['id_sesi'],
            'cargo_name'     => $validated['units'][0]['unit_name'] ?? 'Unit',
            'total_quantity'  => collect($validated['units'])->sum('quantity'),
            'unit'           => 'unit',
            'status'         => 'pending',
            'created_by'     => $request->user()->id,
            'customer_id'    => $this->getDefaultCustomerId(),
        ]);

        // Create session units
        foreach ($validated['units'] as $unitData) {
            $session->units()->create([
                'unit_name' => $unitData['unit_name'],
                'quantity'  => $unitData['quantity'],
            ]);
        }

        // Create 4 stages + assign kapal
        $this->sessionStageService->createStagesForSession($session, [
            'pic_user_id' => $validated['kapal_pic_user_id'],
            'worker_ids'  => $validated['kapal_worker_ids'],
        ]);

        // Redirect to Index page so the new session appears in the list
        return redirect()
            ->route('sesi-pekerja')
            ->with('success', 'Sesi pekerja berhasil dibuat.');
    }

    /**
     * GET /sesi-pekerja/{session}
     * Display session detail with stage stepper.
     */
    public function show(Request $request, ShippingSession $session): Response
    {
        $this->authorizeSuperAdmin($request);

        $session->load(['stages.picUser', 'stages.workers', 'units']);

        $fieldWorkers = $this->getActiveFieldWorkers();

        return Inertia::render('KelolaSesi/Show', [
            'session' => [
                'id'        => (string) $session->id,
                'sessionId' => $session->assignment_no ?? (string) $session->id,
                'notes'     => null,
                'createdAt' => $session->created_at?->format('Y-m-d H:i'),
                'units'     => $session->units->map(fn ($u) => [
                    'id'        => (string) $u->id,
                    'unit_name' => $u->unit_name,
                    'quantity'  => $u->quantity,
                    'notes'     => $u->notes,
                ])->values(),
                'stages'    => $session->stages->map(fn ($s) => [
                    'id'           => (string) $s->id,
                    'stage_type'   => $s->stage_type->value,
                    'stage_order'  => $s->stage_order,
                    'status'       => $s->status->value,
                    'pic_user'     => $s->picUser ? [
                        'id'   => (string) $s->picUser->id,
                        'name' => $s->picUser->name,
                        'email' => $s->picUser->email,
                    ] : null,
                    'workers'      => $s->workers->map(fn ($w) => [
                        'id'   => (string) $w->id,
                        'name' => $w->name,
                        'email' => $w->email,
                    ])->values(),
                    'notes'        => $s->notes,
                    'started_at'   => $s->started_at?->toISOString(),
                    'completed_at' => $s->completed_at?->toISOString(),
                ])->values(),
            ],
            'fieldWorkers' => $fieldWorkers,
        ]);
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/assign
     * Assign PIC + workers to a stage.
     */
    public function assignStage(
        Request $request,
        ShippingSession $session,
        SessionStage $stage,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        // Ensure stage belongs to session
        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Tahap tidak ditemukan untuk sesi ini.'
        );

        $validated = $request->validate([
            'pic_user_id'  => [
                'required',
                'string',
                Rule::exists('users', 'id'),
            ],
            'worker_ids'   => ['required', 'array', 'min:1'],
            'worker_ids.*' => [
                'required',
                'string',
                Rule::exists('users', 'id'),
            ],
        ]);

        try {
            $this->sessionStageService->assignStage(
                $stage,
                $validated['pic_user_id'],
                $validated['worker_ids'],
            );
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Assignment tahap ' . $stage->stage_type->label() . ' berhasil disimpan.');
    }

    /**
     * POST /sesi-pekerja/{session}/stages/{stage}/complete
     * Mark an active stage as complete.
     */
    public function completeStage(
        Request $request,
        ShippingSession $session,
        SessionStage $stage,
    ): RedirectResponse {
        $this->authorizeSuperAdmin($request);

        // Ensure stage belongs to session
        abort_unless(
            $stage->shipping_session_id === $session->id,
            404,
            'Tahap tidak ditemukan untuk sesi ini.'
        );

        try {
            $this->sessionStageService->completeStage($stage);
        } catch (BusinessException $e) {
            return redirect()->back()->withErrors(['stage' => $e->getMessage()]);
        }

        return redirect()
            ->route('sesi-pekerja.show', $session)
            ->with('success', 'Tahap ' . $stage->stage_type->label() . ' berhasil diselesaikan.');
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
     *
     * Only fetches necessary columns and includes intelligent fallback.
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

        // Fallback: If no users found via Spatie role relation, check for fieldworker keywords in email or name
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
     * Returns the first customer or creates a default one.
     */
    private function getDefaultCustomerId(): string
    {
        $customer = \App\Models\Customer::first();

        if (!$customer) {
            $customer = \App\Models\Customer::create([
                'company_name' => 'Default Customer',
            ]);
        }

        return (string) $customer->id;
    }
}
