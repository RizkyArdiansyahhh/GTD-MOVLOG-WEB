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

        $checkpoints = Checkpoint::all()->keyBy('name');

        $assignments = [
            // SES-2048 - Excavator CAT 320 GC (Budi Santoso at Pelabuhan)
            [
                'session'    => $session2,
                'checkpoint' => $checkpoints['Pelabuhan'] ?? null,
                'pic'        => $budi,
                'status'     => 'in_progress',
            ],
            [
                'session'    => $session2,
                'checkpoint' => $checkpoints['Kapal'] ?? null,
                'pic'        => $budi,
                'status'     => 'completed',
            ],
            // TRK-2024-001 - Excavator CAT 320 (Budi Santoso)
            [
                'session'    => $session1,
                'checkpoint' => $checkpoints['Pelabuhan'] ?? null,
                'pic'        => $budi,
                'status'     => 'in_progress',
            ],
            // TRK-2024-002 - Dump Truck Hino (Rudi Hermawan at Tongkang)
            [
                'session'    => $session3,
                'checkpoint' => $checkpoints['Tongkang'] ?? null,
                'pic'        => $rudi,
                'status'     => 'in_progress',
            ],
            // TRK-2024-003 - Komatsu PC200 (Rudi Hermawan at Site)
            [
                'session'    => $session4,
                'checkpoint' => $checkpoints['Site'] ?? null,
                'pic'        => $rudi,
                'status'     => 'completed',
            ],
        ];

        foreach ($assignments as $item) {
            if ($item['session'] && $item['checkpoint']) {
                SessionCheckpoint::firstOrCreate(
                    [
                        'shipping_session_id' => $item['session']->id,
                        'checkpoint_id'       => $item['checkpoint']->id,
                    ],
                    [
                        'pic_user_id' => $item['pic']?->id,
                        'status'      => $item['status'],
                        'sync_status' => 'SYNCED',
                    ]
                );
            }
        }
    }
}