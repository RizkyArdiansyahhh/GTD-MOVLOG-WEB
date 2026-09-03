<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Checkpoint;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class SessionCheckpointSeeder extends Seeder
{
    public function run(): void
    {
        $budi = User::where('email', 'fieldworker@lms.local')->first();
        $rudi = User::where('email', 'rudi.h@lms.local')->first();

        $session1 = ShippingSession::where('assignment_no', 'TRK-2024-001')->first();
        $session2 = ShippingSession::where('assignment_no', 'SES-2048')->first();
        $session3 = ShippingSession::where('assignment_no', 'TRK-2024-002')->first();
        $session4 = ShippingSession::where('assignment_no', 'TRK-2024-003')->first();

        $checkpoints = Checkpoint::orderBy('sequence', 'asc')->get()->keyBy('name');

        // Define strict sequential checkpoint states for each session
        $sessionConfigs = [
            // TRK-2024-001 - Excavator CAT 320 (Currently in Stage 3: Pelabuhan)
            [
                'session' => $session1,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $budi, 'status' => 'in_progress'],
                    ['name' => 'Site',      'pic' => null,  'status' => 'pending'],
                ],
            ],
            // SES-2048 - Excavator CAT 320 GC (Currently in Stage 3: Pelabuhan)
            [
                'session' => $session2,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $budi, 'status' => 'in_progress'],
                    ['name' => 'Site',      'pic' => null,  'status' => 'pending'],
                ],
            ],
            // TRK-2024-002 - Dump Truck Hino 500 (Currently in Stage 2: Tongkang)
            [
                'session' => $session3,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $rudi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $rudi, 'status' => 'in_progress'],
                    ['name' => 'Pelabuhan', 'pic' => null,  'status' => 'pending'],
                    ['name' => 'Site',      'pic' => null,  'status' => 'pending'],
                ],
            ],
            // TRK-2024-003 - Komatsu PC200-8 (Delivered - All 4 Stages Completed)
            [
                'session' => $session4,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $rudi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $rudi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $rudi, 'status' => 'completed'],
                    ['name' => 'Site',      'pic' => $rudi, 'status' => 'completed'],
                ],
            ],
        ];

        foreach ($sessionConfigs as $config) {
            $session = $config['session'];
            if (!$session) {
                continue;
            }

            foreach ($config['stages'] as $stageConfig) {
                $checkpoint = $checkpoints[$stageConfig['name']] ?? null;
                if (!$checkpoint) {
                    continue;
                }

                SessionCheckpoint::updateOrCreate(
                    [
                        'shipping_session_id' => $session->id,
                        'checkpoint_id'       => $checkpoint->id,
                    ],
                    [
                        'pic_user_id' => $stageConfig['pic']?->id,
                        'status'      => $stageConfig['status'],
                        'sync_status' => 'SYNCED',
                    ]
                );
            }
        }
    }
}
