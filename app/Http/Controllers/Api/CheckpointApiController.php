<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Resources\CheckpointResource;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Checkpoint API Controller
 *
 * Exposes read-only access to SessionCheckpoint resources within a ShippingSession.
 * Enforces stage integrity and strict PIC assignment authorization.
 */
class CheckpointApiController extends ApiController
{
    public function __construct(
        private readonly \App\Services\SessionCheckpointService $sessionCheckpointService,
    ) {}

    /**
     * GET /api/v1/sessions/{session}/checkpoints/{checkpoint}
     * Retrieve details of a specific checkpoint including its frozen template snapshot.
     */
    public function show(Request $request, string $sessionId, string $checkpointId): JsonResponse
    {
        $user = $request->user();

        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $checkpoint = SessionCheckpoint::with(['checkpoint', 'picUser'])->find($checkpointId);
        if (!$checkpoint) {
            return $this->notFound('Tahap checkpoint tidak ditemukan.');
        }

        // Integrity check: checkpoint must belong to the requested session
        if ((string) $checkpoint->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.');
        }

        // ─── Authorization Check ──────────────────────────────────────────
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');
        $isSupervisor = $user->hasRole(UserRole::Supervisor->value) || $user->hasRole('supervisor');
        $isStaff = $user->hasRole(UserRole::Staff->value) || $user->hasRole('staff');

        if ($isSuperAdmin || $isSupervisor || $isStaff) {
            // Authorized
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            // Field worker must be the actual assigned PIC of this specific checkpoint
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki akses ke tahap checkpoint ini.');
        }

        return $this->success(
            new CheckpointResource($checkpoint),
            'Checkpoint details retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/sessions/{session}/checkpoints/{checkpoint}/complete
     * Complete the active checkpoint and advance the shipping session.
     */
    public function complete(Request $request, string $sessionId, string $checkpointId): JsonResponse
    {
        $user = $request->user();

        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $checkpoint = SessionCheckpoint::with(['checkpoint', 'picUser', 'shippingSession'])->find($checkpointId);
        if (!$checkpoint) {
            return $this->notFound('Tahap checkpoint tidak ditemukan.');
        }

        // Integrity check: checkpoint must belong to the requested session
        if ((string) $checkpoint->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.');
        }

        // ─── Authorization Check ──────────────────────────────────────────
        // Allowed ONLY for super-admin or field-worker who is assigned PIC of this checkpoint
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');

        if ($isSuperAdmin) {
            // Authorized
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki wewenang untuk menyelesaikan tahap checkpoint ini.');
        }

        $this->sessionCheckpointService->completeCheckpoint($checkpoint);

        return $this->success(
            new CheckpointResource($checkpoint->fresh(['checkpoint', 'picUser'])),
            'Tahap checkpoint berhasil diselesaikan.'
        );
    }
}
