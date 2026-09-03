<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Http\Resources\SessionResource;
use App\Models\ShippingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Session API Controller
 *
 * Exposes read-only access to ShippingSession resources.
 * Enforces role-based and PIC-assignment-based data scoping.
 */
class SessionApiController extends ApiController
{
    /**
     * GET /api/v1/sessions
     * List active or filtered sessions based on user role and assignment.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = ShippingSession::query()
            ->with(['currentCheckpoint', 'units'])
            ->latest();

        // ─── Scoping by Role ──────────────────────────────────────────────
        if ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            // Field worker can only see sessions where they are assigned as PIC in at least one checkpoint
            $query->whereHas('sessionCheckpoints', function ($q) use ($user) {
                $q->where('pic_user_id', $user->id);
            });
        } elseif ($user->hasRole(UserRole::Customer->value) || $user->hasRole('customer')) {
            // Customer can only see their own sessions
            $customerId = $user->customer?->id;
            if (!$customerId) {
                return $this->success([], 'No sessions found for customer.');
            }
            $query->where('customer_id', $customerId);
        }
        // Super-admin, Supervisor, and Staff can view all sessions

        // ─── Filters ──────────────────────────────────────────────────────
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('assignment_no', 'like', "%{$search}%")
                  ->orWhere('cargo_name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 50));

        $paginator = $query->paginate($perPage);

        return $this->paginated(
            SessionResource::collection($paginator),
            'Sessions retrieved successfully.'
        );
    }

    /**
     * GET /api/v1/sessions/{session}
     * Retrieve single session details with checkpoints and units.
     */
    public function show(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();

        $session = ShippingSession::with([
            'currentCheckpoint',
            'units',
            'sessionCheckpoints.checkpoint',
            'sessionCheckpoints.picUser',
        ])->find($sessionId);

        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        // ─── Authorization Check ──────────────────────────────────────────
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');
        $isSupervisor = $user->hasRole(UserRole::Supervisor->value) || $user->hasRole('supervisor');
        $isStaff = $user->hasRole(UserRole::Staff->value) || $user->hasRole('staff');

        if ($isSuperAdmin || $isSupervisor || $isStaff) {
            // Authorized
        } elseif ($user->hasRole(UserRole::Customer->value) || $user->hasRole('customer')) {
            if ((string) $session->customer_id !== (string) $user->customer?->id) {
                return $this->forbidden('Anda tidak memiliki akses ke sesi pengiriman ini.');
            }
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            $isAssigned = $session->sessionCheckpoints->contains('pic_user_id', $user->id);
            if (!$isAssigned) {
                return $this->forbidden('Anda tidak memiliki akses ke sesi pengiriman ini.');
            }
        } else {
            return $this->forbidden('Akses ditolak.');
        }

        return $this->success(
            new SessionResource($session),
            'Session details retrieved successfully.'
        );
    }
}
