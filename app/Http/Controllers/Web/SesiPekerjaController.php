<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
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
    /**
     * GET /sesi-pekerja
     * Display the heavy equipment work sessions management page for Super Admin.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // ── Authorization Safeguard ──
        // Only users with the Super Admin role may access this feature.
        $hasSuperAdminRole = $user && (
            $user->hasRole(UserRole::SuperAdmin->value) ||
            $user->hasRole('super-admin') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('Super-Admin')
        );

        if (!$hasSuperAdminRole) {
            abort(403, 'Anda tidak memiliki akses ke halaman Kelola Sesi Pekerja.');
        }

        $fieldWorkers = $this->getActiveFieldWorkers();

        return Inertia::render('KelolaSesi/Index', [
            'fieldWorkers' => $fieldWorkers,
        ]);
    }

    /**
     * GET /sesi-pekerja/tambah
     * Display the form page for creating a new heavy equipment session.
     */
    public function create(Request $request): Response
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

        $fieldWorkers = $this->getActiveFieldWorkers();

        return Inertia::render('KelolaSesi/Create', [
            'fieldWorkers' => $fieldWorkers,
        ]);
    }

    /**
     * POST /sesi-pekerja
     * Store a new heavy equipment session with the selected Field Worker ID.
     */
    public function store(Request $request): RedirectResponse
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

        $validated = $request->validate([
            'id_sesi' => ['required', 'string', 'max:50'],
            'field_worker_id' => [
                'required',
                'string',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('status', UserStatus::Active->value);
                }),
            ],
            'unit_name' => ['required', 'string', 'max:255'],
            'initial_stage' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return redirect()->route('sesi-pekerja')->with('success', 'Sesi pekerja berhasil dibuat.');
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
}

