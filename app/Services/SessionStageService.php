<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Exceptions\BusinessException;
use App\Models\SessionStage;
use App\Models\ShippingSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Session Stage Service
 *
 * Contains all business logic for managing the 4 sequential logistics stages
 * (kapal -> tongkang -> pelabuhan -> site) of a shipping session.
 */
class SessionStageService extends BaseService
{
    /**
     * Create the 4 stages for a newly created session.
     *
     * Kapal starts as aktif (with started_at = now), the rest start as pending.
     * If kapalAssignment is provided, PIC and workers are set for the kapal stage.
     *
     * @param  array{pic_user_id: string, worker_ids: string[]}|null  $kapalAssignment
     */
    public function createStagesForSession(
        ShippingSession $session,
        ?array $kapalAssignment = null,
    ): void {
        DB::transaction(function () use ($session, $kapalAssignment) {
            $now = Carbon::now();

            foreach (StageType::ordered() as $stageType) {
                $isKapal = $stageType === StageType::Kapal;

                /** @var SessionStage $stage */
                $stage = $session->stages()->create([
                    'stage_type'  => $stageType->value,
                    'stage_order' => $stageType->order(),
                    'status'      => $isKapal ? StageStatus::Aktif->value : StageStatus::Pending->value,
                    'pic_user_id' => $isKapal && $kapalAssignment ? $kapalAssignment['pic_user_id'] : null,
                    'started_at'  => $isKapal ? $now : null,
                ]);

                // Attach workers for kapal stage
                if ($isKapal && $kapalAssignment && !empty($kapalAssignment['worker_ids'])) {
                    $stage->workers()->attach($kapalAssignment['worker_ids']);
                }
            }
        });
    }

    /**
     * Assign PIC and workers to a stage.
     *
     * Allowed for aktif (real assignment) and pending (pre-plan) stages.
     * Not allowed for selesai stages (audit integrity).
     *
     * @param  string[]  $workerIds
     *
     * @throws BusinessException
     */
    public function assignStage(
        SessionStage $stage,
        string $picUserId,
        array $workerIds,
    ): void {
        // Guard: completed stages are immutable for audit purposes
        if ($stage->status === StageStatus::Selesai) {
            throw new BusinessException(
                'Tahap yang sudah selesai tidak bisa diubah assignment-nya.'
            );
        }

        DB::transaction(function () use ($stage, $picUserId, $workerIds) {
            $stage->update(['pic_user_id' => $picUserId]);
            $stage->workers()->sync($workerIds);
        });
    }

    /**
     * Complete the currently active stage and auto-activate the next one.
     *
     * Validation rules enforced at the backend level:
     * 1. Stage must be aktif
     * 2. Stage must have PIC + at least 1 worker
     * 3. All previous stages must be selesai (no skip-ahead)
     *
     * @throws BusinessException
     */
    public function completeStage(SessionStage $stage): void
    {
        // Rule 1: Must be aktif
        if ($stage->status !== StageStatus::Aktif) {
            throw new BusinessException(
                'Hanya tahap dengan status aktif yang bisa diselesaikan.'
            );
        }

        // Rule 2: Must have PIC + >= 1 worker
        if (!$stage->hasCompleteAssignment()) {
            throw new BusinessException(
                'Tahap harus memiliki PIC dan minimal 1 worker sebelum bisa diselesaikan.'
            );
        }

        // Rule 3: All previous stages must be selesai
        $incompletePrior = SessionStage::where('shipping_session_id', $stage->shipping_session_id)
            ->where('stage_order', '<', $stage->stage_order)
            ->where('status', '!=', StageStatus::Selesai->value)
            ->exists();

        if ($incompletePrior) {
            throw new BusinessException(
                'Tidak bisa menyelesaikan tahap ini — tahap sebelumnya belum selesai.'
            );
        }

        DB::transaction(function () use ($stage) {
            $now = Carbon::now();

            // Mark current stage as selesai
            $stage->update([
                'status'       => StageStatus::Selesai->value,
                'completed_at' => $now,
            ]);

            // Auto-activate the next stage (if any)
            $nextStage = SessionStage::where('shipping_session_id', $stage->shipping_session_id)
                ->where('stage_order', $stage->stage_order + 1)
                ->first();

            if ($nextStage && $nextStage->status === StageStatus::Pending) {
                $nextStage->update([
                    'status'     => StageStatus::Aktif->value,
                    'started_at' => $now,
                ]);
            }
        });
    }
}
