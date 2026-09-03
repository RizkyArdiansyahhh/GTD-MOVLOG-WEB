<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\ReportTemplate;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovementServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private Customer $customer;
    private MovementService $movementService;
    private SessionCheckpointService $checkpointService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Borneo Logistik',
            'pic_name'     => 'Hendra',
            'email'        => 'hendra@borneo.com',
            'phone'        => '08123456780',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->movementService = app(MovementService::class);
        $this->checkpointService = app(SessionCheckpointService::class);
    }

    private function createTestSession(string $ref = 'SES-TEST-A'): array
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => $ref,
            'cargo_name'     => 'Heavy Duty Machinery',
            'total_quantity' => 10,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        $this->checkpointService->createCheckpointsForSession($session, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $checkpoints = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->with('checkpoint')
            ->get()
            ->sortBy('checkpoint.sequence')
            ->values();

        return [$session, $checkpoints];
    }

    /** TEST 1: Create Step 1 Tongkang movement -> success */
    public function test_create_step1_tongkang_movement_success(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-001');
        $step1 = $checkpoints[0];

        $movement = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Sentosa 08', 'movement_type' => MovementType::TRANSFER],
            $this->superAdmin->id
        );

        $this->assertNotNull($movement->id);
        $this->assertEquals('Tongkang Sentosa 08', $movement->movement_name);
        $this->assertEquals(MovementType::TRANSFER, $movement->movement_type);
        $this->assertNull($movement->parent_movement_id);
        $this->assertEquals($step1->id, $movement->session_checkpoint_id);
    }

    /** TEST 2: Step 2 resolve/reuse Tongkang -> exact same movement ID */
    public function test_step2_resolves_exact_same_tongkang_movement_id_from_step1(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-002');
        $step1 = $checkpoints[0];
        $step2 = $checkpoints[1];

        $tongkang1 = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Maju 01'],
            $this->superAdmin->id
        );

        $step2Movements = $this->movementService->resolveMovementsForCheckpoint($session, $step2);

        $this->assertCount(1, $step2Movements);
        $this->assertEquals($tongkang1->id, $step2Movements->first()->id);
        $this->assertEquals('Tongkang Maju 01', $step2Movements->first()->movement_name);
    }

    /** TEST 3: Step 2 duplicate child movement -> rejected */
    public function test_cannot_create_new_movement_on_step2(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-003');
        $step2 = $checkpoints[1];

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Tahap Tongkang tidak mendukung pendaftaran armada baru');

        $this->movementService->createMovement(
            $session,
            $step2,
            ['movement_name' => 'Tongkang Fiktif'],
            $this->superAdmin->id
        );
    }

    /** TEST 4 & 5: Create Step 3 Truck with valid parent Tongkang -> success */
    public function test_create_step3_truck_with_valid_parent_tongkang_success(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-004');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Induk 01'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $session,
            $step3,
            [
                'movement_name'      => 'Truk Hino B 9842 UXX',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        $this->assertNotNull($truck->id);
        $this->assertEquals('Truk Hino B 9842 UXX', $truck->movement_name);
        $this->assertEquals(MovementType::HAULING, $truck->movement_type);
        $this->assertEquals($tongkang->id, $truck->parent_movement_id);
    }

    /** TEST 6: Step 4 reuse Truck -> exact same movement ID */
    public function test_step4_resolves_exact_same_truck_movement_id_from_step3(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-005');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];
        $step4 = $checkpoints[3];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Induk'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $session,
            $step3,
            [
                'movement_name'      => 'Truk Isuzu B 9102 KJN',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        $step4Movements = $this->movementService->resolveMovementsForCheckpoint($session, $step4);

        $this->assertCount(1, $step4Movements);
        $this->assertEquals($truck->id, $step4Movements->first()->id);
        $this->assertEquals('Truk Isuzu B 9102 KJN', $step4Movements->first()->movement_name);
    }

    /** TEST 7: Step 4 duplicate child movement -> rejected */
    public function test_cannot_create_new_movement_on_step4(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-006');
        $step4 = $checkpoints[3];

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Tahap Site tidak mendukung pendaftaran armada baru');

        $this->movementService->createMovement(
            $session,
            $step4,
            ['movement_name' => 'Truk Fiktif Site'],
            $this->superAdmin->id
        );
    }

    /** TEST 8: Session A movement cannot be resolved by Session B */
    public function test_session_a_movement_cannot_be_resolved_by_session_b(): void
    {
        [$sessionA, $checkpointsA] = $this->createTestSession('SES-M-007A');
        [$sessionB, $checkpointsB] = $this->createTestSession('SES-M-007B');

        $movA = $this->movementService->createMovement(
            $sessionA,
            $checkpointsA[0],
            ['movement_name' => 'Tongkang Session A'],
            $this->superAdmin->id
        );

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('tidak valid atau bukan milik sesi pengiriman ini');

        $this->movementService->resolveMovementForStage($sessionB, $checkpointsB[0], $movA->id);
    }

    /** TEST 9: Truck with parent from another session -> rejected */
    public function test_truck_cannot_use_parent_tongkang_from_another_session(): void
    {
        [$sessionA, $checkpointsA] = $this->createTestSession('SES-M-008A');
        [$sessionB, $checkpointsB] = $this->createTestSession('SES-M-008B');

        // Tongkang in Session A
        $tongkangA = $this->movementService->createMovement(
            $sessionA,
            $checkpointsA[0],
            ['movement_name' => 'Tongkang Exclusive A'],
            $this->superAdmin->id
        );

        // Attempt to create Truck in Session B using Tongkang A as parent
        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Armada Tongkang asal tidak valid atau bukan berasal dari sesi pengiriman ini');

        $this->movementService->createMovement(
            $sessionB,
            $checkpointsB[2],
            [
                'movement_name'      => 'Truk Illegal B',
                'parent_movement_id' => $tongkangA->id,
            ],
            $this->superAdmin->id
        );
    }

    /** TEST 10: Truck with nonexistent parent -> rejected */
    public function test_truck_with_nonexistent_parent_rejected(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-009');

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Armada Tongkang asal tidak valid');

        $this->movementService->createMovement(
            $session,
            $checkpoints[2],
            [
                'movement_name'      => 'Truk Hino Ghost',
                'parent_movement_id' => '01nonexistentid00000000000',
            ],
            $this->superAdmin->id
        );
    }

    /** TEST 11: Truck cannot use another truck as parent (invalid parent type / circular lineage prevention) */
    public function test_truck_cannot_use_another_truck_as_parent(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-009B');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];

        // Valid Tongkang
        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Asli'],
            $this->superAdmin->id
        );

        // Valid Truck 1
        $truck1 = $this->movementService->createMovement(
            $session,
            $step3,
            [
                'movement_name'      => 'Truk Utama 01',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        // Attempt to create Truck 2 using Truck 1 as parent (invalid: must be a Step 1 Tongkang)
        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Armada Tongkang asal tidak valid atau bukan berasal dari sesi pengiriman ini');

        $this->movementService->createMovement(
            $session,
            $step3,
            [
                'movement_name'      => 'Truk Cabang 02',
                'parent_movement_id' => $truck1->id,
            ],
            $this->superAdmin->id
        );
    }

    /** TEST 12: Checkpoint from another session -> rejected */
    public function test_checkpoint_from_another_session_rejected(): void
    {
        [$sessionA, $checkpointsA] = $this->createTestSession('SES-M-010A');
        [$sessionB, $checkpointsB] = $this->createTestSession('SES-M-010B');

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Checkpoint tidak terdaftar dalam sesi pengiriman ini');

        $this->movementService->createMovement(
            $sessionA,
            $checkpointsB[0], // Checkpoint from Session B!
            ['movement_name' => 'Cross Session Checkpoint Attack'],
            $this->superAdmin->id
        );
    }

    /** TEST 13: Creating ShippingSession + checkpoints DOES NOT create physical movements automatically */
    public function test_creating_session_and_checkpoints_does_not_create_physical_movements(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-011');

        $movementCount = Movement::whereIn('session_checkpoint_id', $checkpoints->pluck('id'))->count();
        $this->assertEquals(0, $movementCount, 'Physical movements must be zero until explicitly registered.');
    }

    /** TEST 14: Multiple Tongkang movements -> each has unique persistent ID */
    public function test_multiple_tongkang_movements_have_unique_persistent_ids(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-012');
        $step1 = $checkpoints[0];

        $t1 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Alpha'], $this->superAdmin->id);
        $t2 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Beta'], $this->superAdmin->id);

        $this->assertNotEquals($t1->id, $t2->id);

        $resolvedStep2 = $this->movementService->resolveMovementsForCheckpoint($session, $checkpoints[1]);
        $this->assertCount(2, $resolvedStep2);
        $this->assertEquals([$t1->id, $t2->id], $resolvedStep2->pluck('id')->toArray());
    }

    /** TEST 15: Multiple Truck movements -> each has unique persistent ID */
    public function test_multiple_truck_movements_have_unique_persistent_ids(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-013');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];
        $step4 = $checkpoints[3];

        $tongkang = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Master'], $this->superAdmin->id);

        $truck1 = $this->movementService->createMovement($session, $step3, ['movement_name' => 'Truk 01 - B 1111 XX', 'parent_movement_id' => $tongkang->id], $this->superAdmin->id);
        $truck2 = $this->movementService->createMovement($session, $step3, ['movement_name' => 'Truk 02 - B 2222 YY', 'parent_movement_id' => $tongkang->id], $this->superAdmin->id);

        $this->assertNotEquals($truck1->id, $truck2->id);

        $resolvedStep4 = $this->movementService->resolveMovementsForCheckpoint($session, $step4);
        $this->assertCount(2, $resolvedStep4);
        $this->assertEquals([$truck1->id, $truck2->id], $resolvedStep4->pluck('id')->toArray());
    }

    /** TEST 16: Duplicate movement name on same checkpoint -> rejected */
    public function test_duplicate_movement_name_on_same_checkpoint_rejected(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-014');
        $step1 = $checkpoints[0];

        $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Kembar'], $this->superAdmin->id);

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage("sudah terdaftar pada tahap ini");

        $this->movementService->createMovement($session, $step1, ['movement_name' => 'tongkang kembar'], $this->superAdmin->id);
    }

    /** TEST 17: Delete movement validation */
    public function test_delete_movement_validation(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-M-015');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];

        $tongkang = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Deletable'], $this->superAdmin->id);
        $truck = $this->movementService->createMovement($session, $step3, ['movement_name' => 'Truk Child', 'parent_movement_id' => $tongkang->id], $this->superAdmin->id);

        // 1. Cannot delete tongkang that has child trucks
        try {
            $this->movementService->deleteMovement($session, $tongkang);
            $this->fail('Expected BusinessException not thrown');
        } catch (BusinessException $e) {
            $this->assertStringContainsString('sudah memiliki armada truk turunan', $e->getMessage());
        }

        // 2. Can delete truck that has no reports
        $this->movementService->deleteMovement($session, $truck);
        $this->assertDatabaseMissing('movements', ['id' => $truck->id]);

        // 3. Now tongkang has no child, can be deleted
        $this->movementService->deleteMovement($session, $tongkang);
        $this->assertDatabaseMissing('movements', ['id' => $tongkang->id]);
    }
}
