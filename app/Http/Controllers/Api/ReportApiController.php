<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Resources\ReportResource;
use App\Models\Movement;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Services\MovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Report API Controller
 *
 * Manages isolated per-movement report instances, values, photos, and completion lifecycle.
 */
class ReportApiController extends ApiController
{
    public function __construct(
        private readonly MovementService $movementService,
    ) {}

    /**
     * GET /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report
     */
    public function show(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId
    ): JsonResponse {
        [$session, $checkpoint, $movement, $authError] = $this->resolveAndAuthorize(
            $request,
            $sessionId,
            $checkpointId,
            $movementId,
            isMutation: false
        );

        if ($authError) {
            return $authError;
        }

        $report = $this->movementService->getOrCreateReportForMovement(
            $session,
            $checkpoint,
            $movement,
            (string) $request->user()->id
        );

        $report->loadMissing(['reportValues.templateField', 'photos.templateField', 'createdBy']);

        return $this->success(
            new ReportResource($report),
            'Report retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report
     */
    public function store(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId
    ): JsonResponse {
        [$session, $checkpoint, $movement, $authError] = $this->resolveAndAuthorize(
            $request,
            $sessionId,
            $checkpointId,
            $movementId,
            isMutation: true
        );

        if ($authError) {
            return $authError;
        }

        $validated = $request->validate([
            'fields'    => ['nullable', 'array'],
            'latitude'  => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'event_at'  => ['nullable', 'date'],
            'photos'    => ['nullable', 'array'],
        ]);

        $fieldValues = $validated['fields'] ?? [];
        $photosData = [];

        // 1. Support multipart file uploads keyed by field_key
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $fieldKey => $uploadedFile) {
                if ($uploadedFile && $uploadedFile->isValid()) {
                    $path = $uploadedFile->store('reports/photos', 'public');
                    $photosData[] = [
                        'field_key'  => (string) $fieldKey,
                        'photo_url'  => Storage::disk('public')->url($path),
                        'taken_at'   => Carbon::now(),
                        'sort_order' => 0,
                    ];
                }
            }
        }

        // 2. Support array of photo objects/URLs (JSON payload)
        if (!empty($validated['photos']) && is_array($validated['photos'])) {
            foreach ($validated['photos'] as $key => $p) {
                if (is_array($p) && !empty($p['photo_url'])) {
                    $photosData[] = [
                        'field_key'         => $p['field_key'] ?? (is_string($key) ? $key : null),
                        'template_field_id' => $p['template_field_id'] ?? null,
                        'photo_url'         => $p['photo_url'],
                        'caption'           => $p['caption'] ?? null,
                        'sort_order'        => (int) ($p['sort_order'] ?? 0),
                        'is_cover'          => (bool) ($p['is_cover'] ?? false),
                        'taken_at'          => !empty($p['taken_at']) ? Carbon::parse($p['taken_at']) : Carbon::now(),
                    ];
                }
            }
        }

        $report = $this->movementService->saveMovementReportData(
            $session,
            $checkpoint,
            $movement,
            $fieldValues,
            $photosData,
            (string) $request->user()->id,
            isset($validated['latitude']) ? (float) $validated['latitude'] : null,
            isset($validated['longitude']) ? (float) $validated['longitude'] : null,
            !empty($validated['event_at']) ? Carbon::parse($validated['event_at']) : null,
        );

        $report->loadMissing(['reportValues.templateField', 'photos.templateField', 'createdBy']);

        return $this->success(
            new ReportResource($report),
            'Laporan armada berhasil disimpan.'
        );
    }

    /**
     * POST /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/complete
     */
    public function complete(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId
    ): JsonResponse {
        [$session, $checkpoint, $movement, $authError] = $this->resolveAndAuthorize(
            $request,
            $sessionId,
            $checkpointId,
            $movementId,
            isMutation: true
        );

        if ($authError) {
            return $authError;
        }

        $report = $this->movementService->completeMovementReport($session, $checkpoint, $movement);

        $report->loadMissing(['reportValues.templateField', 'photos.templateField', 'createdBy']);

        return $this->success(
            new ReportResource($report),
            'Laporan armada berhasil diselesaikan.'
        );
    }

    /**
     * Helper to resolve route parameters and enforce strict role/PIC authorization.
     *
     * @return array{0: ?ShippingSession, 1: ?SessionCheckpoint, 2: ?Movement, 3: ?JsonResponse}
     */
    private function resolveAndAuthorize(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId,
        bool $isMutation
    ): array {
        $session = ShippingSession::find($sessionId);
        if (!$session) {
            return [null, null, null, $this->notFound('Sesi pengiriman tidak ditemukan.')];
        }

        $checkpoint = SessionCheckpoint::with(['checkpoint', 'picUser'])->find($checkpointId);
        if (!$checkpoint || (string) $checkpoint->shipping_session_id !== (string) $session->id) {
            return [null, null, null, $this->notFound('Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.')];
        }

        // Domain verification: movement must be legal for this checkpoint & session
        $movement = $this->movementService->resolveMovementForStage($session, $checkpoint, $movementId);

        $user = $request->user();
        $isSuperAdmin = $user->hasRole(UserRole::SuperAdmin->value) || $user->hasRole('super-admin');
        $isSupervisor = $user->hasRole(UserRole::Supervisor->value) || $user->hasRole('supervisor');
        $isStaff = $user->hasRole(UserRole::Staff->value) || $user->hasRole('staff');

        if ($isSuperAdmin) {
            return [$session, $checkpoint, $movement, null];
        }

        if ($isSupervisor || $isStaff) {
            if ($isMutation) {
                return [null, null, null, $this->forbidden('Peran ini hanya memiliki hak akses lihat (read-only) untuk laporan.')];
            }
            return [$session, $checkpoint, $movement, null];
        }

        if ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return [null, null, null, $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.')];
            }
            return [$session, $checkpoint, $movement, null];
        }

        return [null, null, null, $this->forbidden('Anda tidak memiliki akses ke laporan armada ini.')];
    }
}
