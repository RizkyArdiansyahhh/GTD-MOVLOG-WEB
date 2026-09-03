<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Models\Movement;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Services\MovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Report Photo API Controller
 *
 * Manages uploading, slot-based replacement, and deletion of isolated inspection photos.
 */
class ReportPhotoApiController extends ApiController
{
    public function __construct(
        private readonly MovementService $movementService,
    ) {}

    /**
     * POST /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/photos
     * Upload or replace a photo in a specific photo slot.
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
            $movementId
        );

        if ($authError) {
            return $authError;
        }

        $validated = $request->validate([
            'photo'     => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
            'field_key' => ['required', 'string', 'max:100'],
            'caption'   => ['nullable', 'string', 'max:255'],
            'taken_at'  => ['nullable', 'date'],
        ]);

        $file = $request->file('photo');
        $path = $file->store('reports/photos', 'public');
        $photoUrl = Storage::disk('public')->url($path);

        try {
            $result = $this->movementService->uploadReportPhoto(
                $session,
                $checkpoint,
                $movement,
                $validated['field_key'],
                $photoUrl,
                (string) $request->user()->id,
                $validated['caption'] ?? null,
                !empty($validated['taken_at']) ? Carbon::parse($validated['taken_at']) : null,
            );
        } catch (\Throwable $e) {
            // Storage consistency: delete newly stored file if DB transaction failed
            Storage::disk('public')->delete($path);
            throw $e;
        }

        // Storage consistency: delete old physical file only after DB transaction committed
        if (!empty($result['old_photo_url'])) {
            $this->deletePhysicalFile($result['old_photo_url']);
        }

        $photo = $result['photo'];

        return $this->created([
            'id'                => (string) $photo->id,
            'template_field_id' => $photo->template_field_id,
            'field_key'         => $photo->templateField?->field_key ?? $validated['field_key'],
            'photo_url'         => $photo->photo_url,
            'caption'           => $photo->caption,
            'taken_at'          => $photo->taken_at?->toISOString(),
        ], 'Foto berhasil diunggah.');
    }

    /**
     * DELETE /api/v1/sessions/{session}/checkpoints/{checkpoint}/movements/{movement}/report/photos/{photo}
     * Delete an isolated photo from a report.
     */
    public function destroy(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId,
        string $photoId
    ): JsonResponse {
        [$session, $checkpoint, $movement, $authError] = $this->resolveAndAuthorize(
            $request,
            $sessionId,
            $checkpointId,
            $movementId
        );

        if ($authError) {
            return $authError;
        }

        $photoUrl = $this->movementService->deleteReportPhoto(
            $session,
            $checkpoint,
            $movement,
            $photoId
        );

        $this->deletePhysicalFile($photoUrl);

        return $this->success(null, 'Foto berhasil dihapus.');
    }

    /**
     * Resolve route parameters and enforce strict role / PIC authorization.
     *
     * @return array{0: ?ShippingSession, 1: ?SessionCheckpoint, 2: ?Movement, 3: ?JsonResponse}
     */
    private function resolveAndAuthorize(
        Request $request,
        string $sessionId,
        string $checkpointId,
        string $movementId
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

        if ($isSuperAdmin) {
            return [$session, $checkpoint, $movement, null];
        }

        if ($user->hasRole(UserRole::FieldWorker->value) || $user->hasRole('field-worker')) {
            if ((string) $checkpoint->pic_user_id !== (string) $user->id) {
                return [null, null, null, $this->forbidden('Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.')];
            }
            return [$session, $checkpoint, $movement, null];
        }

        return [null, null, null, $this->forbidden('Anda tidak memiliki wewenang untuk mengelola foto laporan ini.')];
    }

    /**
     * Safely delete physical file from storage disk without failing the request.
     */
    private function deletePhysicalFile(?string $url): void
    {
        if (empty($url)) {
            return;
        }

        try {
            $path = $url;
            if (str_contains($url, '/storage/')) {
                $path = Str::after($url, '/storage/');
            } elseif (filter_var($url, FILTER_VALIDATE_URL)) {
                $parsed = parse_url($url, PHP_URL_PATH);
                if ($parsed && str_contains($parsed, '/storage/')) {
                    $path = Str::after($parsed, '/storage/');
                }
            }

            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
