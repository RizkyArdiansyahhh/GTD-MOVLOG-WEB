<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringCheckpointController extends Controller
{
    /**
     * Halaman index: daftar seluruh shipment (shipping_sessions) beserta
     * checkpoint terkininya. Read-only, tanpa filter kompleks (search
     * dilakukan client-side di frontend untuk saat ini).
     *
     * GET /monitoring-checkpoint
     */
    public function index(): Response
    {
        $sessions = ShippingSession::query()
            ->with([
                'customer:id,company_name',
                'currentCheckpoint:id,name',
                'sessionCheckpoints' => function ($q) {
                    $q->with('reports');
                },
            ])
            ->latest('updated_at')
            ->get();

        $shipments = $sessions->map(function (ShippingSession $session) {
            $totalProgress = 0.0;
            $allCheckpoints = $session->sessionCheckpoints;
            $lastUpdated = null;

            // Setiap step berkontribusi tetap 25% (total 4 step = 100%)
            $stepWeight = 25.0;

            foreach ($allCheckpoints as $sc) {
                $rawStatus = is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status;
                $statusUpper = strtoupper($rawStatus);

                $updatedTime = $sc->actual_finish ?? $sc->actual_start ?? $sc->updated_at;
                if ($updatedTime && (!$lastUpdated || $updatedTime->gt($lastUpdated))) {
                    $lastUpdated = $updatedTime;
                }

                if ($statusUpper === 'COMPLETED' || $statusUpper === 'SELESAI') {
                    // Step telah selesai penuh -> 25% penuh
                    $totalProgress += $stepWeight;
                } elseif ($statusUpper === 'IN_PROGRESS' || $statusUpper === 'AKTIF') {
                    // Step sedang berlangsung: hitung akumulasi laporan di dalam step ini
                    $reports = $sc->reports ?? collect();
                    $totalReportsCount = $reports->count();
                    
                    if ($totalReportsCount > 0) {
                        $completedReportsCount = $reports->where('status', \App\Enums\ReportStatus::COMPLETED)->count();
                        $ratio = $completedReportsCount / $totalReportsCount;
                        $stepProgress = $ratio * $stepWeight;
                        $totalProgress += max(5.0, min($stepWeight, $stepProgress));
                    } else {
                        // Tahap aktif
                        $totalProgress += 5.0;
                    }
                }
            }

            // Jika status pengiriman DELIVERED, pastikan 100%
            $sessionStatus = is_object($session->status) ? ($session->status->value ?? (string) $session->status) : (string) $session->status;
            if (strtolower($sessionStatus) === 'delivered') {
                $totalProgress = 100.0;
            }

            $roundedPercentage = (int) round(min(100.0, max(0.0, $totalProgress)));

            return [
                'id'                     => (string) $session->id,
                'assignmentNo'           => $session->assignment_no,
                'customerName'           => $session->customer->company_name ?? '-',
                'currentCheckpointId'    => $session->current_checkpoint_id,
                'currentCheckpointLabel' => $session->currentCheckpoint->name ?? null,
                'lastUpdatedAt'          => $lastUpdated?->toIso8601String(),
                'progressPercentage'     => $roundedPercentage,
            ];
        });

        return Inertia::render('MonitoringCheckpoint/MonitoringCheckpoint', [
            'shipments' => $shipments,
        ]);
    }

    /**
     * Halaman detail penuh 1 shipment: timeline 4 checkpoint beserta
     * report terbaru (progress lapangan) dan foto per checkpoint.
     *
     * GET /monitoring-checkpoint/{assignmentNo}
     */
    public function show(string $assignmentNo): Response
    {
        $session = ShippingSession::query()
            ->with(['customer:id,company_name'])
            ->where('assignment_no', $assignmentNo)
            ->firstOrFail();

        $this->authorize('view', $session);

        // Semua checkpoint master, urut sequence tetap (Kapal -> Tongkang -> Pelabuhan -> Site)
        $checkpointDefinitions = Checkpoint::query()
            ->orderBy('sequence', 'asc')
            ->get();

        // Semua session_checkpoints milik shipment ini, beserta PIC & report terbaru + foto + dynamic values
        $sessionCheckpoints = $session->sessionCheckpoints()
            ->with([
                'picUser:id,name',
                'reports' => function ($query) {
                    $query->latest('event_at')->limit(1);
                },
                'reports.photos',
                'reports.values.templateField',
            ])
            ->get()
            ->keyBy('checkpoint_id');

        $movementService = app(\App\Services\MovementService::class);

        $steps = $checkpointDefinitions->values()->map(function ($checkpoint, $index) use ($session, $sessionCheckpoints, $movementService) {
            /** @var SessionCheckpoint|null $sessionCheckpoint */
            $sessionCheckpoint = $sessionCheckpoints->get($checkpoint->id);
            $latestReport = $sessionCheckpoint?->reports?->first();

            $rawStatus = is_object($sessionCheckpoint?->status)
                ? ($sessionCheckpoint->status->value ?? (string) $sessionCheckpoint->status)
                : (string) ($sessionCheckpoint?->status ?? 'pending');

            // Resolve physical movements for this step
            $movements = $sessionCheckpoint
                ? $movementService->resolveMovementsForCheckpoint($session, $sessionCheckpoint)
                : collect();

            $movementsData = $movements->map(function ($movement) use ($sessionCheckpoint) {
                $mReport = Report::where('session_checkpoint_id', $sessionCheckpoint->id)
                    ->where('movement_id', $movement->id)
                    ->with(['photos', 'values.templateField'])
                    ->latest('event_at')
                    ->first();

                return [
                    'id'           => $movement->id,
                    'name'         => $movement->movement_name,
                    'type'         => $movement->movement_type->value ?? (string) $movement->movement_type,
                    'status'       => $movement->status->value ?? (string) $movement->status,
                    'report'       => $mReport ? [
                        'id'          => $mReport->id,
                        'eventAt'     => optional($mReport->event_at)?->toIso8601String(),
                        'description' => $mReport->description,
                        'formValues'  => $mReport->values->map(fn ($val) => [
                            'id'        => $val->id,
                            'fieldKey'  => $val->templateField?->field_key ?? $val->templateField?->field_name,
                            'label'     => $val->templateField?->label ?? $val->templateField?->field_name ?? 'Field',
                            'value'     => $val->value,
                            'fieldType' => $val->templateField?->field_type ?? 'text',
                        ])->values()->all(),
                        'photos'      => $mReport->photos->map(fn ($photo) => [
                            'id'       => $photo->id,
                            'photoUrl' => $photo->photo_url,
                            'caption'  => $photo->caption,
                            'isCover'  => (bool) $photo->is_cover,
                            'takenAt'  => optional($photo->taken_at)?->toIso8601String(),
                        ])->values()->all(),
                    ] : null,
                ];
            })->values()->all();

            return [
                'checkpointId'     => $checkpoint->id,
                'order'            => $index + 1,
                'title'            => $checkpoint->name,
                'status'           => $rawStatus,
                'picName'          => $sessionCheckpoint?->picUser?->name,
                'actualStart'      => optional($sessionCheckpoint?->actual_start)?->toIso8601String(),
                'actualFinish'     => optional($sessionCheckpoint?->actual_finish)?->toIso8601String(),
                'templateSnapshot' => $sessionCheckpoint?->template_snapshot,
                'movements'        => $movementsData,
                'latestReport'     => $latestReport ? [
                    'id'            => $latestReport->id,
                    'eventAt'       => optional($latestReport->event_at)?->toIso8601String(),
                    'description'   => $latestReport->description,
                    'movedQuantity' => $latestReport->moved_quantity,
                    'latitude'      => $latestReport->latitude,
                    'longitude'     => $latestReport->longitude,
                    'formValues'    => $latestReport->values->map(fn ($val) => [
                        'id'        => $val->id,
                        'fieldKey'  => $val->templateField?->field_key ?? $val->templateField?->field_name,
                        'label'     => $val->templateField?->label ?? $val->templateField?->field_name ?? 'Field',
                        'value'     => $val->value,
                        'fieldType' => $val->templateField?->field_type ?? 'text',
                    ])->values()->all(),
                    'photos'        => $latestReport->photos->map(fn ($photo) => [
                        'id'       => $photo->id,
                        'photoUrl' => $photo->photo_url,
                        'caption'  => $photo->caption,
                        'isCover'  => (bool) $photo->is_cover,
                        'takenAt'  => optional($photo->taken_at)?->toIso8601String(),
                    ])->values()->all(),
                ] : null,
            ];
        });

        return Inertia::render('MonitoringCheckpoint/CheckpointDetail', [
            'shipment' => [
                'id' => $session->id,
                'assignmentNo' => $session->assignment_no,
                'customerName' => $session->customer->company_name ?? '-',
                'cargoName' => $session->cargo_name,
                'currentCheckpointId' => $session->current_checkpoint_id,
                'steps' => $steps,
            ],
        ]);
    }
}
