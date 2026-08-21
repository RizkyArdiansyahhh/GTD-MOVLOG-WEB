<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\DTOs\UserDTO;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola Akun Controller (Web / Inertia)
 *
 * Handles the account management page for super-admin users.
 * Fetches real user data from the database with search, role filter,
 * and status filter support.
 */
class KelolaAkunController extends Controller
{
    /**
     * Map Spatie role names to Indonesian display labels.
     */
    private const ROLE_MAP = [
        'super-admin'  => 'Super Admin',
        'supervisor'   => 'Supervisor',
        'staff'        => 'Staff',
        'field-worker' => 'Field Worker',
        'customer'     => 'Customer',
    ];

    public function __construct(
        private readonly UserService $userService,
    ) {}

    /**
     * GET /kelola-akun
     * Display the account management page with paginated users and stats.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->query('per_page', 5);
        $search  = $request->query('search');
        $role    = $request->query('role');
        $status  = $request->query('status');

        // ── Build user query ──
        $query = User::with('roles')
            ->orderBy('created_at', 'desc');

        // Search by name or email (DB agnostic case-insensitive search)
        if ($search && trim($search) !== '') {
            $keyword = strtolower(trim($search));
            $query->where(function ($q) use ($keyword) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$keyword}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$keyword}%"]);
            });
        }

        // Filter by role (support both Spatie role name and display label)
        if ($role && $role !== 'Semua Role') {
            $spatieRoleName = $this->unmapRoleLabel($role);
            $query->whereHas('roles', function ($q) use ($spatieRoleName, $role) {
                $q->whereIn('name', array_unique([$spatieRoleName, strtolower($role)]));
            });
        }

        // Filter by status
        if ($status && $status !== 'Semua Status') {
            $statusValue = match (strtolower($status)) {
                'aktif', 'active'             => 'active',
                'tidak aktif', 'inactive'     => 'inactive',
                'pending', 'pending verification' => 'pending',
                default                       => null,
            };
            if ($statusValue) {
                $query->where('status', $statusValue);
            }
        }

        $users = $query->paginate($perPage)->withQueryString();

        // ── Transform users for frontend ──
        $transformedUsers = $users->through(function (User $user) {
            $firstRole = $user->roles->first()?->name;

            return [
                'id'        => (string) $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'status'    => $user->status === UserStatus::Active ? 'Aktif' : 'Tidak Aktif',
                'role'      => $this->mapRoleLabel($firstRole),
                'avatarUrl' => $user->avatar_url
                    ?? 'https://ui-avatars.com/api/?name=' . urlencode($user->name) . '&background=F5B800&color=fff&bold=true&size=128',
                'phone'     => $user->phone,
                'createdAt' => $user->created_at?->toISOString(),
            ];
        });

        // ── Stats ──
        $totalUsers     = User::count();
        $inactiveUsers  = User::where('status', UserStatus::Inactive)->count();

        // Count users by internal roles (non-customer)
        $internalRoles = ['super-admin', 'supervisor', 'staff', 'field-worker'];
        $adminInternal = User::whereHas('roles', function ($q) use ($internalRoles) {
            $q->whereIn('name', $internalRoles);
        })->where('status', UserStatus::Active)->count();

        $customerCount = User::whereHas('roles', function ($q) {
            $q->where('name', 'customer');
        })->count();

        // Available display labels for filter dropdown
        $availableRoles = array_values(self::ROLE_MAP);

        return Inertia::render('KelolaAkun/Index', [
            'users' => $transformedUsers,
            'stats' => [
                'totalPengguna'         => $totalUsers,
                'totalPenggunaBulanIni' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'adminInternal'         => $adminInternal,
                'customer'              => $customerCount,
                'akunNonaktif'          => $inactiveUsers,
            ],
            'availableRoles' => $availableRoles,
            'filters' => $request->only(['search', 'role', 'status', 'per_page']),
        ]);
    }

    /**
     * PATCH /kelola-akun/{user}/status
     * Toggle or update account status for a specific user.
     */
    public function toggleStatus(Request $request, User $user)
    {
        // Business Rule Safeguard: Prevent self-deactivation of currently logged-in user
        if ($request->user() && $user->id === $request->user()->id) {
            $statusInput = strtolower($request->input('status', ''));
            if (in_array($statusInput, ['tidak aktif', 'inactive'])) {
                return redirect()->back()->withErrors([
                    'status' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
                ]);
            }
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:Aktif,Tidak Aktif,active,inactive'],
        ]);

        $newStatusValue = match (strtolower($validated['status'])) {
            'aktif', 'active'             => UserStatus::Active->value,
            'tidak aktif', 'inactive'     => UserStatus::Inactive->value,
            default                       => UserStatus::Inactive->value,
        };

        $user->update([
            'status' => $newStatusValue,
        ]);

        $actionLabel = $newStatusValue === UserStatus::Active->value ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->to('/kelola-akun')->with('success', "Status akun {$user->name} berhasil {$actionLabel}.");
    }

    /**
     * GET /kelola-akun/tambah
     * Show the Tambah Akun (Add Account) form.
     */
    public function create(): Response
    {
        $availableRoles = collect(UserRole::cases())->map(fn (UserRole $role) => [
            'value' => $role->value,
            'label' => $role->label(),
        ])->values()->all();

        return Inertia::render('KelolaAkun/TambahAkun', [
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * POST /kelola-akun/tambah
     * Store a newly created user from the Tambah Akun form.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create(UserDTO::from($request->validated()));

        return redirect()->route('kelola-akun')
            ->with('success', 'Akun baru berhasil ditambahkan.');
    }

    /**
     * Map Spatie role names to Indonesian display labels.
     */
    private function mapRoleLabel(?string $role): string
    {
        if (!$role) return 'Tidak Ada Role';
        return self::ROLE_MAP[strtolower($role)] ?? ucfirst($role);
    }

    /**
     * Unmap display label back to Spatie role name.
     */
    private function unmapRoleLabel(string $label): string
    {
        $flipped = array_flip(self::ROLE_MAP);
        return $flipped[$label] ?? strtolower($label);
    }
}
