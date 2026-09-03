<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\SyncStatus;
use App\Exceptions\BusinessException;
use App\Models\Checkpoint;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Session Checkpoint Service
 *
 * Manages the sequential checkpoint progression (Kapal -> Tongkang -> Pelabuhan -> Site)
 * using the standard ERD session_checkpoints & checkpoints tables.
 */
class SessionCheckpointService extends BaseService
{
    /**
     * Initialize session checkpoints for a newly created session.
     *
     * The first checkpoint starts as IN_PROGRESS (aktif) and gets assigned to the provided PIC.
     * Subsequent checkpoints start as PENDING.
     * Each checkpoint captures an immutable template_snapshot from the active master ReportTemplate.
     *
     * @param  array{pic_user_id?: string}|null  $initialAssignment
     */
    public function createCheckpointsForSession(
        ShippingSession $session,
        ?array $initialAssignment = null,
    ): void {
        DB::transaction(function () use ($session, $initialAssignment) {
            $now = Carbon::now();
            $checkpoints = Checkpoint::with(['reportTemplates.templateFields'])->orderBy('sequence', 'asc')->get();

            $firstCheckpoint = null;

            foreach ($checkpoints as $index => $checkpoint) {
                $isFirst = ($index === 0);

                // Build immutable template snapshot from active master template
                $template = $checkpoint->reportTemplates->sortByDesc('created_at')->first();
                $snapshot = null;

                if ($template) {
                    $fields = $template->templateFields->sortBy('sort_order');
                    $formFields = [];
                    $photoSlots = [];

                    foreach ($fields as $field) {
                        $fieldData = [
                            'field_key'  => $field->field_key ?? $field->field_name,
                            'label'      => $field->label ?? $field->field_name,
                            'field_type' => $field->field_type,
                            'required'   => (bool) $field->required,
                            'options'    => $field->options,
                            'sort_order' => (int) $field->sort_order,
                        ];

                        if ($field->field_type === 'photo') {
                            $photoSlots[] = $fieldData;
                        } else {
                            $formFields[] = $fieldData;
                        }
                    }

                    $snapshot = [
                        'template_id'   => $template->id,
                        'template_name' => $template->name,
                        'version'       => 1,
                        'fields'        => array_values($formFields),
                        'photo_slots'   => array_values($photoSlots),
                    ];
                }

                SessionCheckpoint::create([
                    'shipping_session_id' => $session->id,
                    'checkpoint_id'       => $checkpoint->id,
                    'pic_user_id'         => $isFirst && !empty($initialAssignment['pic_user_id']) ? $initialAssignment['pic_user_id'] : null,
                    'status'              => $isFirst ? SessionCheckpointStatus::IN_PROGRESS : SessionCheckpointStatus::PENDING,
                    'actual_start'        => $isFirst ? $now : null,
                    'sync_status'         => SyncStatus::SYNCED,
                    'template_snapshot'   => $snapshot,
                ]);

                if ($isFirst) {
                    $firstCheckpoint = $checkpoint;
                }
            }

            if ($firstCheckpoint) {
                $session->update([
                    'current_checkpoint_id' => $firstCheckpoint->id,
                    'status'                => ShippingSessionStatus::IN_TRANSIT,
                ]);
            }
        });
    }

    /**
     * Assign PIC to a session checkpoint.
     *
     * @throws BusinessException
     */
    public function assignCheckpoint(
        SessionCheckpoint $sessionCheckpoint,
        string $picUserId,
    ): void {
        if ($sessionCheckpoint->status === SessionCheckpointStatus::COMPLETED) {
            throw new BusinessException(
                'Tahap checkpoint yang sudah selesai tidak bisa diubah PIC-nya.'
            );
        }

        $sessionCheckpoint->update([
            'pic_user_id' => $picUserId,
        ]);
    }

    /**
     * Complete the active checkpoint and auto-activate the next checkpoint in sequence.
     *
     * @throws BusinessException
     */
    public function completeCheckpoint(SessionCheckpoint $sessionCheckpoint): void
    {
        DB::transaction(function () use ($sessionCheckpoint) {
            $lockedCheckpoint = SessionCheckpoint::where('id', $sessionCheckpoint->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCheckpoint->status !== SessionCheckpointStatus::IN_PROGRESS) {
                throw new BusinessException(
                    'Hanya checkpoint dengan status aktif yang bisa diselesaikan.'
                );
            }

            if (empty($lockedCheckpoint->pic_user_id)) {
                throw new BusinessException(
                    'Checkpoint harus memiliki PIC sebelum diselesaikan.'
                );
            }

            $session = $lockedCheckpoint->shippingSession;
            $currentSeq = $lockedCheckpoint->checkpoint->sequence;

            // Verify prior checkpoints are completed
            $incompletePrior = SessionCheckpoint::where('shipping_session_id', $session->id)
                ->whereHas('checkpoint', function ($query) use ($currentSeq) {
                    $query->where('sequence', '<', $currentSeq);
                })
                ->where('status', '!=', SessionCheckpointStatus::COMPLETED->value)
                ->exists();

            if ($incompletePrior) {
                throw new BusinessException(
                    'Tidak bisa menyelesaikan checkpoint ini — checkpoint sebelumnya belum selesai.'
                );
            }

            // Verify that physical movements are registered and have completed reports
            $movementService = app(MovementService::class);
            $movements = $movementService->resolveMovementsForCheckpoint($session, $lockedCheckpoint);

            if ($movements->isEmpty()) {
                throw new BusinessException(
                    'Tidak bisa menyelesaikan tahap ini karena belum ada armada fisik yang terdaftar.'
                );
            }

            foreach ($movements as $mov) {
                $report = \App\Models\Report::where('session_checkpoint_id', $lockedCheckpoint->id)
                    ->where('movement_id', $mov->id)
                    ->first();

                if (!$report || $report->status !== \App\Enums\ReportStatus::COMPLETED) {
                    throw new BusinessException(
                        "Armada '{$mov->movement_name}' belum menyelesaikan seluruh laporan/foto pada tahap ini."
                    );
                }
            }

            $now = Carbon::now();

            $lockedCheckpoint->update([
                'status'        => SessionCheckpointStatus::COMPLETED,
                'actual_finish' => $now,
            ]);

            // Find next checkpoint
            $nextSessionCheckpoint = SessionCheckpoint::where('shipping_session_id', $session->id)
                ->whereHas('checkpoint', function ($query) use ($currentSeq) {
                    $query->where('sequence', '>', $currentSeq);
                })
                ->with('checkpoint')
                ->get()
                ->sortBy(fn ($sc) => $sc->checkpoint->sequence)
                ->first();

            if ($nextSessionCheckpoint) {
                $nextSessionCheckpoint->update([
                    'status'       => SessionCheckpointStatus::IN_PROGRESS,
                    'actual_start' => $now,
                ]);

                $session->update([
                    'current_checkpoint_id' => $nextSessionCheckpoint->checkpoint_id,
                ]);
            } else {
                // All checkpoints finished
                $session->update([
                    'status' => ShippingSessionStatus::DELIVERED,
                ]);
            }
        });
    }
}
