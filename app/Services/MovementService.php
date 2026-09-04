<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\SyncStatus;
use App\Exceptions\BusinessException;
use App\Models\Movement;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\ReportValue;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\TemplateField;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Movement Service
 *
 * Manages physical transport movement identities (Tongkang in Steps 1 & 2, Trucks in Steps 3 & 4)
 * with strict multi-modal lineage, persistent identity reuse, and isolated per-Movement Report Instances.
 */
class MovementService extends BaseService
{
    /**
     * Create a new physical movement for an allowed registration checkpoint (Step 1 or Step 3).
     *
     * Invariants:
     * - Step 1 (Kapal): Registers physical Tongkang / Barge movements.
     * - Step 2 (Tongkang): REUSES Step 1 movements. NO new movements allowed.
     * - Step 3 (Pelabuhan): Registers physical Truck movements, linked to parent Tongkang from Step 1.
     * - Step 4 (Site): REUSES Step 3 truck movements. NO new movements allowed.
     *
     * @param  array{
     *     movement_name: string,
     *     movement_type?: string|MovementType,
     *     parent_movement_id?: string|null,
     *     status?: string|MovementStatus
     * }  $data
     *
     * @throws BusinessException
     */
    public function createMovement(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        array $data,
        string $userId,
    ): Movement {
        $this->assertCheckpointBelongsToSession($session, $checkpoint);

        // Physical movement registration is prohibited on completed/skipped checkpoints or delivered sessions
        if (
            $checkpoint->status === SessionCheckpointStatus::COMPLETED
            || $checkpoint->status === SessionCheckpointStatus::SKIPPED
            || $session->status === ShippingSessionStatus::DELIVERED
        ) {
            throw new BusinessException('Registrasi armada tidak diizinkan pada tahap yang sudah selesai atau sesi yang sudah dikirim.');
        }

        $checkpoint->loadMissing('checkpoint');
        $sequence = $checkpoint->checkpoint?->sequence ?? 0;

        // Prohibit registration on Step 2 or Step 4
        if ($sequence === 2 || $sequence === 4) {
            $stageName = $checkpoint->checkpoint?->name ?? "Tahap {$sequence}";
            throw new BusinessException(
                "Tahap {$stageName} tidak mendukung pendaftaran armada baru. Gunakan armada yang sudah terdaftar dari tahap sebelumnya."
            );
        }

        $customId = !empty($data['id']) ? trim((string) $data['id']) : null;
        if ($customId !== null) {
            if (Movement::where('id', $customId)->exists()) {
                throw new BusinessException('ID armada sudah terdaftar.', 422);
            }
        }

        if (empty($data['movement_name']) || trim($data['movement_name']) === '') {
            throw new BusinessException('Nama armada / pergerakan fisik wajib diisi.');
        }

        $movementName = trim($data['movement_name']);

        // Prevent duplicate movement identity in the same checkpoint of this session
        $isDuplicate = Movement::where('session_checkpoint_id', $checkpoint->id)
            ->whereRaw('LOWER(movement_name) = ?', [strtolower($movementName)])
            ->exists();

        if ($isDuplicate) {
            throw new BusinessException(
                "Armada dengan nama '{$movementName}' sudah terdaftar pada tahap ini."
            );
        }

        $parentMovementId = null;
        $movementType = $this->resolveMovementType($sequence, $data['movement_type'] ?? null);

        // Step 3 (Trucking) requires a valid parent Tongkang from Step 1 of the SAME session
        if ($sequence === 3) {
            $parentMovementId = $this->resolveAndValidateParentTongkang($session, $data['parent_movement_id'] ?? null);
        }

        return DB::transaction(function () use ($checkpoint, $movementName, $movementType, $parentMovementId, $userId, $data, $customId) {
            $nextSequence = Movement::where('session_checkpoint_id', $checkpoint->id)->count() + 1;

            $status = MovementStatus::IN_PROGRESS;
            if (!empty($data['status'])) {
                $status = $data['status'] instanceof MovementStatus
                    ? $data['status']
                    : MovementStatus::tryFrom($data['status']) ?? MovementStatus::IN_PROGRESS;
            }

            $attributes = [
                'session_checkpoint_id' => $checkpoint->id,
                'parent_movement_id'    => $parentMovementId,
                'movement_name'         => $movementName,
                'movement_type'         => $movementType,
                'sequence'              => $nextSequence,
                'status'                => $status,
                'created_by'            => $userId,
            ];

            if ($customId !== null) {
                $attributes['id'] = $customId;
            }

            return Movement::create($attributes);
        });
    }

    /**
     * Resolve all valid movements for a given checkpoint in the session.
     *
     * - Step 1: Returns Tongkang movements created in Step 1.
     * - Step 2: Returns the EXACT SAME Tongkang movements created in Step 1.
     * - Step 3: Returns Truck movements created in Step 3.
     * - Step 4: Returns the EXACT SAME Truck movements created in Step 3.
     *
     * @return Collection<int, Movement>
     *
     * @throws BusinessException
     */
    public function resolveMovementsForCheckpoint(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
    ): Collection {
        $this->assertCheckpointBelongsToSession($session, $checkpoint);

        $checkpoint->loadMissing('checkpoint');
        $sequence = $checkpoint->checkpoint?->sequence ?? 0;

        if ($sequence === 1) {
            return Movement::where('session_checkpoint_id', $checkpoint->id)
                ->with(['parentMovement', 'createdBy'])
                ->orderBy('sequence', 'asc')
                ->get();
        }

        if ($sequence === 2) {
            $step1Checkpoint = $this->findCheckpointBySequence($session, 1);
            if (!$step1Checkpoint) {
                return new Collection();
            }

            return Movement::where('session_checkpoint_id', $step1Checkpoint->id)
                ->with(['parentMovement', 'createdBy'])
                ->orderBy('sequence', 'asc')
                ->get();
        }

        if ($sequence === 3) {
            return Movement::where('session_checkpoint_id', $checkpoint->id)
                ->with(['parentMovement', 'createdBy'])
                ->orderBy('sequence', 'asc')
                ->get();
        }

        if ($sequence === 4) {
            $step3Checkpoint = $this->findCheckpointBySequence($session, 3);
            if (!$step3Checkpoint) {
                return new Collection();
            }

            return Movement::where('session_checkpoint_id', $step3Checkpoint->id)
                ->with(['parentMovement', 'createdBy'])
                ->orderBy('sequence', 'asc')
                ->get();
        }

        return new Collection();
    }

    /**
     * Resolve and validate that a specific movement is legal for reporting at the given checkpoint.
     *
     * @throws BusinessException
     */
    public function resolveMovementForStage(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        string $movementId,
    ): Movement {
        $this->assertCheckpointBelongsToSession($session, $checkpoint);

        $checkpoint->loadMissing('checkpoint');
        $sequence = $checkpoint->checkpoint?->sequence ?? 0;

        $targetOriginSequence = ($sequence === 1 || $sequence === 2) ? 1 : 3;
        $originCheckpoint = $this->findCheckpointBySequence($session, $targetOriginSequence);

        if (!$originCheckpoint) {
            throw new BusinessException('Tahap asal pergerakan tidak ditemukan dalam sesi ini.');
        }

        $movement = Movement::where('id', $movementId)
            ->where('session_checkpoint_id', $originCheckpoint->id)
            ->first();

        if (!$movement) {
            throw new BusinessException(
                "Movement '{$movementId}' tidak valid atau bukan milik sesi pengiriman ini."
            );
        }

        return $movement;
    }

    /**
     * Get the isolated Report instance for a specific physical movement at a given checkpoint.
     */
    public function getReportForMovement(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
    ): ?Report {
        $this->resolveMovementForStage($session, $checkpoint, (string) $movement->id);

        return Report::where('session_checkpoint_id', $checkpoint->id)
            ->where('movement_id', $movement->id)
            ->with(['reportValues.templateField', 'photos.templateField', 'createdBy'])
            ->first();
    }

    /**
     * Get or instantiate an isolated Report instance for a specific physical movement at a given checkpoint.
     */
    public function getOrCreateReportForMovement(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
        string $userId,
    ): Report {
        $validMovement = $this->resolveMovementForStage($session, $checkpoint, (string) $movement->id);

        $templateId = $checkpoint->template_snapshot['template_id']
            ?? $checkpoint->checkpoint?->reportTemplates()->first()?->id;

        if (!$templateId) {
            throw new BusinessException('Template pelaporan tidak ditemukan untuk tahap ini.');
        }

        return Report::firstOrCreate(
            [
                'session_checkpoint_id' => $checkpoint->id,
                'movement_id'           => $validMovement->id,
            ],
            [
                'report_template_id'    => $templateId,
                'status'                => ReportStatus::IN_PROGRESS,
                'report_type'           => ReportType::Movement,
                'created_by'            => $userId,
                'sync_status'           => SyncStatus::SYNCED,
            ]
        );
    }

    /**
     * Save isolated movement-specific report data (values and photos) for a specific physical movement.
     *
     * @param  array<string, mixed>  $fieldValues  Key-value map where key can be template_field_id or field_key
     * @param  array<int, array{
     *     template_field_id?: int,
     *     field_key?: string,
     *     photo_url: string,
     *     caption?: string|null,
     *     taken_at?: string|\DateTimeInterface|null,
     *     sort_order?: int,
     *     is_cover?: bool
     * }>  $photosData
     *
     * @throws BusinessException
     */
    public function saveMovementReportData(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
        array $fieldValues,
        array $photosData,
        string $userId,
        ?float $latitude = null,
        ?float $longitude = null,
        ?\DateTimeInterface $eventAt = null,
    ): Report {
        return DB::transaction(function () use (
            $session,
            $checkpoint,
            $movement,
            $fieldValues,
            $photosData,
            $userId,
            $latitude,
            $longitude,
            $eventAt
        ) {
            $report = $this->getOrCreateReportForMovement($session, $checkpoint, $movement, $userId);

            if ($report->status === ReportStatus::COMPLETED) {
                throw new BusinessException('Laporan armada yang sudah berstatus COMPLETED tidak dapat diubah lagi.');
            }

            // 1. Update report header metadata
            $updateData = [];
            if ($latitude !== null) {
                $updateData['latitude'] = $latitude;
            }
            if ($longitude !== null) {
                $updateData['longitude'] = $longitude;
            }
            if ($eventAt !== null) {
                $updateData['event_at'] = $eventAt;
            } else if ($report->event_at === null) {
                $updateData['event_at'] = Carbon::now();
            }

            if (!empty($updateData)) {
                $report->update($updateData);
            }

            // 2. Save isolated dynamic field values
            foreach ($fieldValues as $key => $val) {
                $field = is_numeric($key)
                    ? TemplateField::find((int) $key)
                    : TemplateField::where('template_id', $report->report_template_id)->where('field_key', $key)->first();

                if ($field) {
                    ReportValue::updateOrCreate(
                        [
                            'report_id'         => $report->id,
                            'template_field_id' => $field->id,
                        ],
                        [
                            'value'             => is_array($val) ? json_encode($val) : (string) $val,
                        ]
                    );
                }
            }

            // 3. Save isolated photos (enforcing 1 active photo per slot)
            foreach ($photosData as $photo) {
                $templateFieldId = $photo['template_field_id'] ?? null;
                if (!$templateFieldId && !empty($photo['field_key'])) {
                    $templateFieldId = TemplateField::where('template_id', $report->report_template_id)
                        ->where('field_key', $photo['field_key'])
                        ->value('id');
                }

                $existingPhoto = null;
                if ($templateFieldId) {
                    $existingPhoto = ReportPhoto::where('report_id', $report->id)
                        ->where('template_field_id', $templateFieldId)
                        ->first();
                }

                if ($existingPhoto) {
                    $existingPhoto->update([
                        'photo_url'  => $photo['photo_url'],
                        'caption'    => $photo['caption'] ?? $existingPhoto->caption,
                        'sort_order' => (int) ($photo['sort_order'] ?? $existingPhoto->sort_order),
                        'is_cover'   => (bool) ($photo['is_cover'] ?? $existingPhoto->is_cover),
                        'taken_at'   => $photo['taken_at'] ?? Carbon::now(),
                    ]);
                } else {
                    ReportPhoto::create([
                        'report_id'         => $report->id,
                        'template_field_id' => $templateFieldId,
                        'photo_url'         => $photo['photo_url'],
                        'caption'           => $photo['caption'] ?? null,
                        'sort_order'        => (int) ($photo['sort_order'] ?? 0),
                        'is_cover'          => (bool) ($photo['is_cover'] ?? false),
                        'taken_at'          => $photo['taken_at'] ?? Carbon::now(),
                    ]);
                }
            }

            return $report->fresh(['reportValues.templateField', 'photos.templateField']);
        });
    }

    /**
     * Validate whether a report meets all snapshot requirements (fields, photo slots, GPS, timestamp).
     *
     * @return array<int, string> Array of error messages if incomplete, or empty array if complete.
     */
    public function validateReportCompletion(Report $report, SessionCheckpoint $checkpoint): array
    {
        $report->loadMissing(['reportValues.templateField', 'photos.templateField']);
        $snapshot = $checkpoint->template_snapshot;

        $errors = [];

        // 1. Validate required form fields
        $requiredFields = collect($snapshot['fields'] ?? [])->where('required', true);
        $filledValues = $report->reportValues
            ->filter(fn ($rv) => $rv->value !== null && trim((string) $rv->value) !== '')
            ->keyBy(fn ($rv) => $rv->templateField?->field_key ?? (string) $rv->template_field_id);

        foreach ($requiredFields as $rf) {
            $key = $rf['field_key'];
            if (!$filledValues->has($key)) {
                $label = $rf['label'] ?? $key;
                $errors[] = "Field '{$label}' wajib diisi.";
            }
        }

        // 2. Validate required photo slots
        $requiredPhotoSlots = collect($snapshot['photo_slots'] ?? [])->where('required', true);
        $uploadedPhotoSlots = $report->photos
            ->filter(fn ($rp) => !empty($rp->photo_url))
            ->pluck('templateField.field_key')
            ->filter()
            ->unique();

        foreach ($requiredPhotoSlots as $ps) {
            $key = $ps['field_key'];
            if (!$uploadedPhotoSlots->contains($key)) {
                $label = $ps['label'] ?? $key;
                $errors[] = "Foto '{$label}' wajib diunggah.";
            }
        }

        // 3. Validate GPS coordinates
        if ($report->latitude === null || $report->longitude === null) {
            $errors[] = 'Koordinat GPS (latitude dan longitude) wajib dicatat.';
        }

        // 4. Validate Event Timestamp
        if ($report->event_at === null) {
            $errors[] = 'Waktu pencatatan laporan (event_at) wajib diisi.';
        }

        return $errors;
    }

    /**
     * Mark a physical movement's report as COMPLETED after strict requirement verification.
     *
     * @throws BusinessException
     */
    public function completeMovementReport(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
    ): Report {
        $validMovement = $this->resolveMovementForStage($session, $checkpoint, (string) $movement->id);

        return DB::transaction(function () use ($checkpoint, $validMovement) {
            $report = Report::where('session_checkpoint_id', $checkpoint->id)
                ->where('movement_id', $validMovement->id)
                ->lockForUpdate()
                ->first();

            if (!$report) {
                throw new BusinessException('Laporan belum diisi untuk armada ini.');
            }

            if ($report->status === ReportStatus::COMPLETED) {
                throw new BusinessException('Laporan armada yang sudah berstatus COMPLETED tidak dapat diubah lagi.');
            }

            $errors = $this->validateReportCompletion($report, $checkpoint);
            if (!empty($errors)) {
                throw new BusinessException(
                    'Laporan belum lengkap: ' . implode(' ', $errors)
                );
            }

            $report->update([
                'status' => ReportStatus::COMPLETED,
            ]);

            $validMovement->update([
                'status' => MovementStatus::COMPLETED,
            ]);

            return $report->fresh(['reportValues.templateField', 'photos.templateField']);
        });
    }

    /**
     * Upload or replace an isolated photo for a specific photo slot in a movement's report.
     * Enforces exactly 1 active ReportPhoto per slot, replacing any existing photo.
     *
     * @return array{photo: ReportPhoto, old_photo_url: ?string}
     *
     * @throws BusinessException
     */
    public function uploadReportPhoto(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
        string $fieldKey,
        string $photoUrl,
        string $userId,
        ?string $caption = null,
        ?\DateTimeInterface $takenAt = null,
    ): array {
        $validMovement = $this->resolveMovementForStage($session, $checkpoint, (string) $movement->id);
        $report = $this->getOrCreateReportForMovement($session, $checkpoint, $validMovement, $userId);

        if ($report->status === ReportStatus::COMPLETED) {
            throw new BusinessException('Laporan armada yang sudah berstatus COMPLETED tidak dapat diubah lagi.');
        }

        // Validate slot against checkpoint's frozen template_snapshot
        $snapshot = $checkpoint->template_snapshot;
        $photoSlots = collect($snapshot['photo_slots'] ?? []);
        $slot = $photoSlots->firstWhere('field_key', $fieldKey);

        if (!$slot) {
            throw new BusinessException("Slot foto '{$fieldKey}' tidak valid untuk tahap ini.");
        }

        $templateFieldId = $slot['id'] ?? null;
        if (!$templateFieldId) {
            $templateFieldId = TemplateField::where('template_id', $report->report_template_id)
                ->where('field_key', $fieldKey)
                ->value('id');
        }

        $oldPhotoUrl = null;

        $photo = DB::transaction(function () use ($report, $templateFieldId, $fieldKey, $photoUrl, $caption, $slot, $takenAt, &$oldPhotoUrl) {
            $existingPhoto = ReportPhoto::where('report_id', $report->id)
                ->where(function ($q) use ($templateFieldId, $fieldKey) {
                    if ($templateFieldId) {
                        $q->where('template_field_id', $templateFieldId);
                    }
                    $q->orWhereHas('templateField', fn ($tf) => $tf->where('field_key', $fieldKey));
                })
                ->first();

            if ($existingPhoto) {
                $oldPhotoUrl = $existingPhoto->photo_url;
                $existingPhoto->update([
                    'photo_url'         => $photoUrl,
                    'caption'           => $caption,
                    'template_field_id' => $templateFieldId ?? $existingPhoto->template_field_id,
                    'taken_at'          => $takenAt ?? Carbon::now(),
                ]);
                return $existingPhoto->fresh(['templateField']);
            }

            return ReportPhoto::create([
                'report_id'         => $report->id,
                'template_field_id' => $templateFieldId,
                'photo_url'         => $photoUrl,
                'caption'           => $caption,
                'sort_order'        => (int) ($slot['sort_order'] ?? 0),
                'is_cover'          => false,
                'taken_at'          => $takenAt ?? Carbon::now(),
            ])->loadMissing(['templateField']);
        });

        return [
            'photo'         => $photo,
            'old_photo_url' => $oldPhotoUrl,
        ];
    }

    /**
     * Delete an isolated photo from a movement's report.
     *
     * @return string The photo_url of the deleted photo for storage cleanup
     *
     * @throws BusinessException
     */
    public function deleteReportPhoto(
        ShippingSession $session,
        SessionCheckpoint $checkpoint,
        Movement $movement,
        string $photoId,
    ): string {
        $validMovement = $this->resolveMovementForStage($session, $checkpoint, (string) $movement->id);

        $report = Report::where('session_checkpoint_id', $checkpoint->id)
            ->where('movement_id', $validMovement->id)
            ->first();

        if (!$report) {
            throw new BusinessException('Laporan tidak ditemukan untuk armada ini.');
        }

        if ($report->status === ReportStatus::COMPLETED) {
            throw new BusinessException('Laporan armada yang sudah berstatus COMPLETED tidak dapat diubah lagi.');
        }

        $photo = ReportPhoto::where('report_id', $report->id)->where('id', $photoId)->first();
        if (!$photo) {
            throw new BusinessException('Foto tidak ditemukan pada laporan ini.');
        }

        $photoUrl = $photo->photo_url;

        DB::transaction(function () use ($photo) {
            $photo->delete();
        });

        return $photoUrl;
    }

    /**
     * Update a physical movement's details (e.g. movement_name).
     *
     * @param  array{movement_name: string}  $data
     *
     * @throws BusinessException
     */
    public function updateMovement(
        ShippingSession $session,
        Movement $movement,
        array $data,
        string $userId,
    ): Movement {
        $movement->loadMissing('sessionCheckpoint');
        $checkpoint = $movement->sessionCheckpoint;

        if (!$checkpoint || (string) $checkpoint->shipping_session_id !== (string) $session->id) {
            throw new BusinessException('Movement tidak terdaftar dalam sesi pengiriman ini.');
        }

        if (
            $checkpoint->status === SessionCheckpointStatus::COMPLETED
            || $checkpoint->status === SessionCheckpointStatus::SKIPPED
            || $session->status === ShippingSessionStatus::DELIVERED
        ) {
            throw new BusinessException('Perubahan armada tidak diizinkan pada tahap yang sudah selesai atau sesi yang sudah dikirim.');
        }

        if ($movement->status === MovementStatus::COMPLETED) {
            throw new BusinessException('Armada yang sudah berstatus COMPLETED tidak dapat diubah lagi.');
        }

        if (empty($data['movement_name']) || trim($data['movement_name']) === '') {
            throw new BusinessException('Nama armada / pergerakan fisik wajib diisi.');
        }

        $movementName = trim($data['movement_name']);

        // Check duplicate name in same checkpoint excluding self
        $isDuplicate = Movement::where('session_checkpoint_id', $checkpoint->id)
            ->where('id', '!=', $movement->id)
            ->whereRaw('LOWER(movement_name) = ?', [strtolower($movementName)])
            ->exists();

        if ($isDuplicate) {
            throw new BusinessException(
                "Armada dengan nama '{$movementName}' sudah terdaftar pada tahap ini."
            );
        }

        $movement->update([
            'movement_name' => $movementName,
        ]);

        $movement->loadMissing('parentMovement');

        return $movement;
    }

    /**
     * Delete a physical movement if it has no associated reports and no dependent child movements.
     *
     * @throws BusinessException
     */
    public function deleteMovement(ShippingSession $session, Movement $movement): void
    {
        $movement->loadMissing('sessionCheckpoint');
        if ($movement->sessionCheckpoint?->shipping_session_id !== $session->id) {
            throw new BusinessException('Movement tidak terdaftar dalam sesi pengiriman ini.');
        }

        if ($movement->reports()->exists()) {
            throw new BusinessException('Armada yang sudah memiliki laporan aktivitas tidak dapat dihapus.');
        }

        if ($movement->childMovements()->exists()) {
            throw new BusinessException('Armada tongkang yang sudah memiliki armada truk turunan tidak dapat dihapus.');
        }

        $movement->delete();
    }

    /**
     * Validate that parent_movement_id belongs to Step 1 Tongkang in the SAME session.
     *
     * @throws BusinessException
     */
    private function resolveAndValidateParentTongkang(ShippingSession $session, ?string $parentMovementId): string
    {
        if (empty($parentMovementId)) {
            // If there's only 1 Tongkang in Step 1, auto-bind as fallback
            $step1Checkpoint = $this->findCheckpointBySequence($session, 1);
            if ($step1Checkpoint) {
                $step1Movements = Movement::where('session_checkpoint_id', $step1Checkpoint->id)->get();
                if ($step1Movements->count() === 1) {
                    return (string) $step1Movements->first()->id;
                }
            }

            throw new BusinessException('Armada truk wajib memilih armada Tongkang asal muatan.');
        }

        $step1Checkpoint = $this->findCheckpointBySequence($session, 1);
        if (!$step1Checkpoint) {
            throw new BusinessException('Tahap Kapal / Tongkang asal tidak ditemukan pada sesi ini.');
        }

        $parentMovement = Movement::where('id', $parentMovementId)
            ->where('session_checkpoint_id', $step1Checkpoint->id)
            ->first();

        if (!$parentMovement) {
            throw new BusinessException(
                'Armada Tongkang asal tidak valid atau bukan berasal dari sesi pengiriman ini.'
            );
        }

        return (string) $parentMovement->id;
    }

    /**
     * Assert that the checkpoint belongs to the given session.
     *
     * @throws BusinessException
     */
    private function assertCheckpointBelongsToSession(ShippingSession $session, SessionCheckpoint $checkpoint): void
    {
        if ($checkpoint->shipping_session_id !== $session->id) {
            throw new BusinessException('Checkpoint tidak terdaftar dalam sesi pengiriman ini.');
        }
    }

    /**
     * Find SessionCheckpoint by its checkpoint sequence number.
     */
    private function findCheckpointBySequence(ShippingSession $session, int $sequence): ?SessionCheckpoint
    {
        return SessionCheckpoint::where('shipping_session_id', $session->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', $sequence))
            ->first();
    }

    /**
     * Resolve default or provided MovementType for a stage sequence.
     */
    private function resolveMovementType(int $sequence, mixed $type): MovementType
    {
        if ($type instanceof MovementType) {
            return $type;
        }

        if (is_string($type) && $resolved = MovementType::tryFrom($type)) {
            return $resolved;
        }

        return ($sequence === 3)
            ? MovementType::HAULING
            : MovementType::TRANSFER;
    }
}
