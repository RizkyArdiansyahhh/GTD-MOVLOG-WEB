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
        $session5 = ShippingSession::where('assignment_no', 'TRK-2024-004')->first();

        $checkpoints = Checkpoint::orderBy('sequence', 'asc')->get()->keyBy('name');

        // Define strict sequential checkpoint states for each session
        $sessionConfigs = [
            // TRK-2024-001 - Excavator CAT 320 (Stage 3: Pelabuhan in progress)
            [
                'session' => $session1,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $rudi, 'status' => 'in_progress'],
                    ['name' => 'Site',      'pic' => $rudi, 'status' => 'pending'],
                ],
            ],
            // SES-2048 - Excavator CAT 320 GC (Stage 3: Pelabuhan in progress)
            [
                'session' => $session2,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $budi, 'status' => 'in_progress'],
                    ['name' => 'Site',      'pic' => null,  'status' => 'pending'],
                ],
            ],
            // TRK-2024-002 - Dump Truck Hino 500 (Stage 2: Tongkang in progress)
            [
                'session' => $session3,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $rudi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $rudi, 'status' => 'in_progress'],
                    ['name' => 'Pelabuhan', 'pic' => $budi, 'status' => 'pending'],
                    ['name' => 'Site',      'pic' => $budi, 'status' => 'pending'],
                ],
            ],
            // TRK-2024-003 - Komatsu PC200-8 (Delivered - All 4 Stages Completed)
            [
                'session' => $session4,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Pelabuhan', 'pic' => $budi, 'status' => 'completed'],
                    ['name' => 'Site',      'pic' => $budi, 'status' => 'completed'],
                ],
            ],
            // TRK-2024-004 - Generator Set Cummins 1500 kVA (Stage 1: Kapal in progress)
            [
                'session' => $session5,
                'stages'  => [
                    ['name' => 'Kapal',     'pic' => $budi, 'status' => 'in_progress'],
                    ['name' => 'Tongkang',  'pic' => $budi, 'status' => 'pending'],
                    ['name' => 'Pelabuhan', 'pic' => $rudi, 'status' => 'pending'],
                    ['name' => 'Site',      'pic' => $rudi, 'status' => 'pending'],
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

                $seq = $checkpoint->sequence ?? 1;
                $status = $stageConfig['status'];

                $actualStart = null;
                $actualFinish = null;

                if ($status === 'completed') {
                    $actualStart = now()->subDays(6 - $seq)->setHour(8)->setMinute(30);
                    $actualFinish = now()->subDays(5 - $seq)->setHour(17)->setMinute(0);
                } elseif ($status === 'in_progress') {
                    $actualStart = now()->subHours(12);
                    $actualFinish = null;
                }

                $template = $checkpoint->reportTemplates()->latest()->first();
                $snapshot = null;
                if ($template) {
                    $fields = $template->templateFields()->orderBy('sort_order')->get();
                    $formFields = [];
                    $photoSlots = [];
                    foreach ($fields as $field) {
                        if (strtolower($field->field_type) === 'photo') {
                            $photoSlots[] = [
                                'key'      => $field->field_key ?? $field->field_name,
                                'label'    => $field->label ?? $field->field_name,
                                'required' => (bool) $field->required,
                            ];
                        } else {
                            $formFields[] = [
                                'key'        => $field->field_key ?? $field->field_name,
                                'label'      => $field->label ?? $field->field_name,
                                'field_type' => $field->field_type,
                                'required'   => (bool) $field->required,
                            ];
                        }
                    }
                    $snapshot = [
                        'template_id'   => $template->id,
                        'template_name' => $template->name,
                        'fields'        => $formFields,
                        'photo_slots'   => $photoSlots,
                    ];
                }

                SessionCheckpoint::updateOrCreate(
                    [
                        'shipping_session_id' => $session->id,
                        'checkpoint_id'       => $checkpoint->id,
                    ],
                    [
                        'pic_user_id'       => $stageConfig['pic']?->id,
                        'status'            => $status,
                        'actual_start'      => $actualStart,
                        'actual_finish'     => $actualFinish,
                        'template_snapshot' => $snapshot,
                        'sync_status'       => 'SYNCED',
                    ]
                );
            }
        }
    }
}
