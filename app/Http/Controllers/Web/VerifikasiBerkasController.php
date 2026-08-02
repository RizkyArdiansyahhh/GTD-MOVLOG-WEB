<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Verifikasi Berkas Controller (Web / Inertia)
 *
 * Used by Supervisors to verify shipment documents before operational approval.
 */
class VerifikasiBerkasController extends Controller
{
    /**
     * GET /verifikasi-berkas
     * Display the document verification page for Supervisors.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // ── Authorization Safeguard ──
        // Only users with the Supervisor role may access this feature.
        // Super Admin, Admin, Staff, Field Worker, and Customer are NOT allowed.
        $hasSupervisorRole = $user && (
            $user->hasRole(UserRole::Supervisor->value) ||
            $user->hasRole('supervisor') ||
            $user->hasRole('Supervisor')
        );

        if (!$hasSupervisorRole) {
            abort(403, 'Anda tidak memiliki akses ke halaman Verifikasi Berkas.');
        }

        return Inertia::render('VerifikasiBerkas/Index');
    }
}
