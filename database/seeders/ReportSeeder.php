<?php

namespace Database\Seeders;

use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\SyncStatus;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\SessionCheckpoint;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sessionCheckpoints = SessionCheckpoint::with(['checkpoint', 'shippingSession', 'picUser'])
            ->whereIn('status', ['completed', 'in_progress', 'COMPLETED', 'IN_PROGRESS'])
            ->get();

        $descriptions = [
            'Kapal' => [
                'Pemuatan kargo ke atas Kapal MV selesai. Lashing dan pengecekan keamanan muatan telah diverifikasi sesuai SOP maritim.',
                'Kapal telah lepas sandar dari pelabuhan asal menuju pelabuhan transit tujuan. Kondisi cuaca baik dan stabil.',
            ],
            'Tongkang' => [
                'Proses transshipment dari Kapal ke Tongkang telah rampung. Pengecekan stabilitas muatan dan draft kapal aman.',
                'Tongkang telah tiba di perairan transit dan bersiap merapat ke dermaga pembongkaran.',
            ],
            'Pelabuhan' => [
                'Pembongkaran kargo di dermaga pelabuhan transit berjalan lancar. Kargo telah diinspeksi dan siap dimuat ke unit darat/trucking.',
                'Unit kargo berada di staging area pelabuhan dan menunggu giliran konvoi pengiriman menuju site.',
            ],
            'Site' => [
                'Kargo telah tiba dengan selamat di Site Tujuan (POD). Pemeriksaan fisik bersama tim site telah dilakukan tanpa kerusakan (Good Condition).',
                'Serah terima kargo kepada perwakilan customer di site telah selesai dan ditandatangani.',
            ],
        ];

        $defaultTemplate = \App\Models\ReportTemplate::first();

        $movementService = app(\App\Services\MovementService::class);
        $demoPhotoUrl = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80';

        foreach ($sessionCheckpoints as $sc) {
            $checkpointName = $sc->checkpoint?->name ?? 'Pelabuhan';
            $descList = $descriptions[$checkpointName] ?? ['Laporan operasional lapangan telah diverifikasi.'];

            $eventAt = $sc->actual_finish ?? $sc->actual_start ?? now()->subDays(1);
            $picId = $sc->pic_user_id ?? User::where('email', 'fieldworker@lms.local')->value('id');

            $rawStatus = is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status;
            $checkpointStatus = in_array(strtolower($rawStatus), ['completed', 'selesai'])
                ? ReportStatus::COMPLETED
                : ReportStatus::IN_PROGRESS;

            // Resolve physical movements for this stage
            $movements = $sc->shippingSession
                ? $movementService->resolveMovementsForCheckpoint($sc->shippingSession, $sc)
                : collect();

            $photoSlots = $sc->template_snapshot['photo_slots'] ?? [
                ['key' => 'foto_utama', 'label' => 'Dokumentasi ' . $checkpointName],
            ];

            $template = $sc->checkpoint?->reportTemplates()->latest()->first() ?? $defaultTemplate;

            if ($movements->isNotEmpty()) {
                foreach ($movements as $mIndex => $movement) {
                    $mStatus = $movement->status === \App\Enums\MovementStatus::COMPLETED
                        ? ReportStatus::COMPLETED
                        : ReportStatus::IN_PROGRESS;

                    $report = Report::updateOrCreate(
                        [
                            'session_checkpoint_id' => $sc->id,
                            'movement_id'           => $movement->id,
                        ],
                        [
                            'report_template_id'    => $template?->id,
                            'status'                => $mStatus,
                            'event_at'              => $eventAt,
                            'report_type'           => ReportType::Movement,
                            'moved_quantity'        => 1.00,
                            'description'           => "{$movement->movement_name}: " . $descList[$mIndex % count($descList)],
                            'latitude'              => -1.265386,
                            'longitude'             => 116.831200,
                            'created_by'            => $picId,
                            'sync_status'           => SyncStatus::SYNCED,
                        ]
                    );

                    foreach ($photoSlots as $pIndex => $slot) {
                        ReportPhoto::updateOrCreate(
                            [
                                'report_id'  => $report->id,
                                'sort_order' => $pIndex + 1,
                            ],
                            [
                                'photo_url' => $demoPhotoUrl,
                                'caption'   => $slot['label'] ?? ('Dokumentasi ' . $checkpointName),
                                'is_cover'  => ($pIndex === 0),
                                'taken_at'  => $eventAt,
                            ]
                        );
                    }
                }
            } else {
                // Fallback for checkpoints without movement entities
                $report = Report::updateOrCreate(
                    [
                        'session_checkpoint_id' => $sc->id,
                        'movement_id'           => null,
                    ],
                    [
                        'report_template_id'    => $template?->id,
                        'status'                => $checkpointStatus,
                        'event_at'              => $eventAt,
                        'report_type'           => ReportType::Checkpoint,
                        'moved_quantity'        => 1.00,
                        'description'           => $descList[0],
                        'latitude'              => -1.265386,
                        'longitude'             => 116.831200,
                        'created_by'            => $picId,
                        'sync_status'           => SyncStatus::SYNCED,
                    ]
                );

                foreach ($photoSlots as $pIndex => $slot) {
                    ReportPhoto::updateOrCreate(
                        [
                            'report_id'  => $report->id,
                            'sort_order' => $pIndex + 1,
                        ],
                        [
                            'photo_url' => $demoPhotoUrl,
                            'caption'   => $slot['label'] ?? ('Dokumentasi ' . $checkpointName),
                            'is_cover'  => ($pIndex === 0),
                            'taken_at'  => $eventAt,
                        ]
                    );
                }
            }
        }
    }
}
