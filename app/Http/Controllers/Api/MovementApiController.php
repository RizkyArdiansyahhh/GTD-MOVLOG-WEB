<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Resources\MovementResource;
use App\Models\Movement;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Services\MovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Movement API Controller
 *
 * Exposes RESTful endpoints for managing physical transport movements (Tongkang & Trucks).
 * Delegates all domain invariants, lineage validation, and deletion checks to MovementService.
 */
class MovementApiController extends ApiController
{
    public function __construct(
        private readonly MovementService $movementService,
    ) {}

    /**
     * GET /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements
     * List resolved physical movements for a specific checkpoint stage.
     */
    public function index(Request $request, string $sessionId, string $checkpointId): JsonResponse
    {
        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $checkpoint = SessionCheckpoint::with(['checkpoint', 'picUser'])->find($checkpointId);
        if (!$checkpoint || (string) $checkpoint->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.');
        }

        $user = $request->user();
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');
        $isSupervisor = $user->hasRole(UserRole::Supervisor->value) || $user->hasRole('supervisor');
        $isStaff = $user->hasRole(UserRole::Staff->value) || $user->hasRole('staff');

        if ($isSuperAdmin || $isSupervisor || $isStaff) {
            // Authorized to view movements
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki akses ke data pergerakan armada tahap ini.');
        }

        $movements = $this->movementService->resolveMovementsForCheckpoint($session, $checkpoint);
        $movements->loadMissing('parentMovement');

        return $this->success(
            MovementResource::collection($movements),
            'Movements retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements
     * Register a new physical movement (Tongkang in Step 1 or Truck in Step 3).
     */
    public function store(Request $request, string $sessionId, string $checkpointId): JsonResponse
    {
        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $checkpoint = SessionCheckpoint::with(['checkpoint', 'picUser'])->find($checkpointId);
        if (!$checkpoint || (string) $checkpoint->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.');
        }

        $user = $request->user();
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');

        if ($isSuperAdmin) {
            // Authorized to register movement
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki wewenang untuk mendaftarkan armada fisik.');
        }

        $validated = $request->validate([
            'id'                 => ['nullable', 'string', 'ulid'],
            'movement_name'      => ['required', 'string', 'max:255'],
            'parent_movement_id' => ['nullable', 'string'],
        ]);

        $movement = $this->movementService->createMovement(
            $session,
            $checkpoint,
            $validated,
            (string) $user->id
        );

        $movement->loadMissing('parentMovement');

        return $this->created(
            new MovementResource($movement),
            'Armada fisik berhasil didaftarkan.'
        );
    }

    /**
     * PUT|PATCH /api/v1/sessions/{session}/movements/{movement}
     * Update an existing physical movement (e.g. rename).
     */
    public function update(Request $request, string $sessionId, string $movementId): JsonResponse
    {
        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $movement = Movement::with('sessionCheckpoint')->find($movementId);
        if (!$movement || (string) $movement->sessionCheckpoint?->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Armada tidak ditemukan pada sesi pengiriman ini.');
        }

        $user = $request->user();
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');

        if ($isSuperAdmin) {
            // Authorized to update
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $movement->sessionCheckpoint?->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang berwenang mengubah armada ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki wewenang untuk mengubah data armada fisik.');
        }

        $validated = $request->validate([
            'movement_name' => ['required', 'string', 'max:255'],
        ]);

        $updatedMovement = $this->movementService->updateMovement(
            $session,
            $movement,
            $validated,
            (string) $user->id
        );

        return $this->success(
            new MovementResource($updatedMovement),
            'Armada berhasil diperbarui.'
        );
    }

    /**
     * DELETE /api/v1/sessions/{session}/movements/{movement}
     * Delete an unstarted physical movement.
     */
    public function destroy(Request $request, string $sessionId, string $movementId): JsonResponse
    {
        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return $this->notFound('Sesi pengiriman tidak ditemukan.');
        }

        $movement = Movement::with('sessionCheckpoint')->find($movementId);
        if (!$movement || (string) $movement->sessionCheckpoint?->shipping_session_id !== (string) $session->id) {
            return $this->notFound('Armada tidak ditemukan pada sesi pengiriman ini.');
        }

        $user = $request->user();
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');

        if ($isSuperAdmin) {
            // Authorized to delete
        } elseif ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $movement->sessionCheckpoint?->pic_user_id !== (string) $user->id) {
                return $this->forbidden('Anda bukan petugas PIC yang berwenang menghapus armada ini.');
            }
        } else {
            return $this->forbidden('Anda tidak memiliki wewenang untuk menghapus armada fisik.');
        }

        $this->movementService->deleteMovement($session, $movement);

        return $this->success(null, 'Armada berhasil dihapus.');
    }
}
