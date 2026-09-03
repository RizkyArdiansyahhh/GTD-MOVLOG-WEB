<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
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
            ->with(['customer:id,company_name', 'currentCheckpoint:id,name'])
            ->withCount([
                'sessionCheckpoints as completed_checkpoints_count' => function ($query) {
                    $query->where('status', 'COMPLETED');
                },
            ])
            ->latest('updated_at')
            ->get();

        $totalCheckpoints = Checkpoint::count();

        $shipments = $sessions->map(function (ShippingSession $session) use ($totalCheckpoints) {
            $lastCheckpointLog = $session->sessionCheckpoints()
                ->where('checkpoint_id', $session->current_checkpoint_id)
                ->latest('actual_finish')
                ->first();

            return [
                'id' => $session->id,
                'assignmentNo' => $session->assignment_no,
                'customerName' => $session->customer->company_name ?? '-',
                'currentCheckpointId' => $session->current_checkpoint_id,
                'currentCheckpointLabel' => $session->currentCheckpoint->name ?? null,
                'lastUpdatedAt' => optional($lastCheckpointLog?->actual_finish ?? $lastCheckpointLog?->actual_start)
                    ?->toIso8601String(),
                'progressPercentage' => $totalCheckpoints > 0
                    ? (int) round(($session->completed_checkpoints_count / $totalCheckpoints) * 100)
                    : 0,
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

        // Semua checkpoint master, urut tetap (MV -> Tongkang -> Pelabuhan -> Site).
        // Asumsi urutan mengikuti kolom `id` pada tabel checkpoints; sesuaikan
        // ke kolom `order`/`sequence` jika tabel checkpoints punya kolom urutan eksplisit.
        $checkpointDefinitions = Checkpoint::query()
            ->orderBy('id')
            ->get();

        // Semua session_checkpoints milik shipment ini, beserta PIC & report terbaru + foto.
        $sessionCheckpoints = $session->sessionCheckpoints()
            ->with([
                'picUser:id,name',
                'reports' => function ($query) {
                    $query->latest('event_at')->limit(1);
                },
                'reports.photos',
            ])
            ->get()
            ->keyBy('checkpoint_id');

        $steps = $checkpointDefinitions->values()->map(function ($checkpoint, $index) use ($sessionCheckpoints) {
            /** @var SessionCheckpoint|null $sessionCheckpoint */
            $sessionCheckpoint = $sessionCheckpoints->get($checkpoint->id);
            $latestReport = $sessionCheckpoint?->reports?->first();

            return [
                'checkpointId' => $checkpoint->id,
                'order' => $index + 1,
                'title' => $checkpoint->name,
                'status' => $sessionCheckpoint->status ?? 'pending',
                'picName' => $sessionCheckpoint?->picUser?->name,
                'actualStart' => optional($sessionCheckpoint?->actual_start)?->toIso8601String(),
                'actualFinish' => optional($sessionCheckpoint?->actual_finish)?->toIso8601String(),
                'latestReport' => $latestReport ? [
                    'id' => $latestReport->id,
                    'eventAt' => optional($latestReport->event_at)?->toIso8601String(),
                    'description' => $latestReport->description,
                    'movedQuantity' => $latestReport->moved_quantity,
                    'latitude' => $latestReport->latitude,
                    'longitude' => $latestReport->longitude,
                    'photos' => $latestReport->photos->map(fn ($photo) => [
                        'id' => $photo->id,
                        'photoUrl' => $photo->photo_url,
                        'caption' => $photo->caption,
                        'isCover' => (bool) $photo->is_cover,
                        'takenAt' => optional($photo->taken_at)?->toIso8601String(),
                    ]),
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
