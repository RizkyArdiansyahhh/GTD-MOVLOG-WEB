<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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

        return Inertia::render('KelolaSesi/Index');
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

        return Inertia::render('KelolaSesi/Create');
    }
}
