<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use App\Models\Movement;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class MovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds strictly 2 Tongkang and 3 Truk physical movements following Parent-Child Lineage.
     */
    public function run(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        $superAdmin = User::where('email', 'superadmin@lms.local')->first()
            ?? User::first();

        // 1. Target Shipment: TRK-2024-001 (Excavator CAT 320 - Active Session)
        $session1 = ShippingSession::where('assignment_no', 'TRK-2024-001')->first();
        if ($session1) {
            $this->seedSessionMovements(
                $session1,
                $superAdmin->id,
                [
                    ['name' => 'BG Marine Power 3001', 'status' => MovementStatus::COMPLETED],
                    ['name' => 'BG Samudera Perkasa 02', 'status' => MovementStatus::COMPLETED],
                ],
                [
                    [
                        'name'        => 'Trailer Lowbed KT 8831 QA',
                        'parent_idx'  => 0, // Tongkang 1
                        'status'      => MovementStatus::COMPLETED,
                    ],
                    [
                        'name'        => 'Trailer Lowbed B 9482 UT',
                        'parent_idx'  => 0, // Tongkang 1
                        'status'      => MovementStatus::IN_PROGRESS,
                    ],
                    [
                        'name'        => 'Trailer Tronton KT 7712 MZ',
                        'parent_idx'  => 1, // Tongkang 2
                        'status'      => MovementStatus::PENDING,
                    ],
                ]
            );
        }

        // 2. Target Shipment: TRK-2024-003 (Komatsu PC200-8 - 100% Delivered Session)
        $session3 = ShippingSession::where('assignment_no', 'TRK-2024-003')->first();
        if ($session3) {
            $this->seedSessionMovements(
                $session3,
                $superAdmin->id,
                [
                    ['name' => 'BG United Maritime 01', 'status' => MovementStatus::COMPLETED],
                    ['name' => 'BG United Maritime 02', 'status' => MovementStatus::COMPLETED],
                ],
                [
                    [
                        'name'        => 'Trailer Lowbed KT 1001 UM',
                        'parent_idx'  => 0,
                        'status'      => MovementStatus::COMPLETED,
                    ],
                    [
                        'name'        => 'Trailer Lowbed KT 1002 UM',
                        'parent_idx'  => 0,
                        'status'      => MovementStatus::COMPLETED,
                    ],
                    [
                        'name'        => 'Trailer Tronton KT 1003 UM',
                        'parent_idx'  => 1,
                        'status'      => MovementStatus::COMPLETED,
                    ],
                ]
            );
        }
    }

    /**
     * Helper to seed strictly 2 Tongkang (Step 1) and 3 Trucks (Step 3 with Parent-Child relation).
     */
    private function seedSessionMovements(
        ShippingSession $session,
        string $userId,
        array $tongkangsConfig,
        array $trucksConfig
    ): void {
        $step1Checkpoint = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->first();

        $step3Checkpoint = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 3))
            ->first();

        if (!$step1Checkpoint || !$step3Checkpoint) {
            return;
        }

        // A. Seed Step 1 Tongkangs (2 Unit)
        $createdTongkangs = [];
        foreach ($tongkangsConfig as $index => $config) {
            $tongkang = Movement::updateOrCreate(
                [
                    'session_checkpoint_id' => $step1Checkpoint->id,
                    'movement_name'         => $config['name'],
                ],
                [
                    'parent_movement_id'    => null,
                    'movement_type'         => MovementType::TRANSFER,
                    'sequence'              => $index + 1,
                    'status'                => $config['status'],
                    'created_by'            => $userId,
                ]
            );
            $createdTongkangs[] = $tongkang;
        }

        // B. Seed Step 3 Trucks (3 Unit linked to Parent Tongkangs)
        foreach ($trucksConfig as $index => $config) {
            $parentTongkang = $createdTongkangs[$config['parent_idx']] ?? $createdTongkangs[0];

            Movement::updateOrCreate(
                [
                    'session_checkpoint_id' => $step3Checkpoint->id,
                    'movement_name'         => $config['name'],
                ],
                [
                    'parent_movement_id'    => $parentTongkang->id,
                    'movement_type'         => MovementType::HAULING,
                    'sequence'              => $index + 1,
                    'status'                => $config['status'],
                    'created_by'            => $userId,
                ]
            );
        }
    }
}
