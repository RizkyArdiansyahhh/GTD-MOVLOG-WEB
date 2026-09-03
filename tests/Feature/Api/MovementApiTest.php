<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\MovementType;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MovementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $supervisor;
    private User $staff;
    private User $workerPicStep1;
    private User $workerPicStep3;
    private User $workerUnassigned;
    private User $customerUser;
    private Customer $customer;

    private ShippingSession $session;
    private SessionCheckpoint $step1;
    private SessionCheckpoint $step2;
    private SessionCheckpoint $step3;
    private SessionCheckpoint $step4;

    private MovementService $movementService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->movementService = app(MovementService::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Borneo Resources',
            'pic_name'     => 'Budi',
            'email'        => 'budi@borneoresources.com',
            'phone'        => '08123456789',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->supervisor = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->supervisor->assignRole(UserRole::Supervisor->value);

        $this->staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->staff->assignRole(UserRole::Staff->value);

        $this->workerPicStep1 = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->workerPicStep1->assignRole(UserRole::FieldWorker->value);

        $this->workerPicStep3 = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->workerPicStep3->assignRole(UserRole::FieldWorker->value);

        $this->workerUnassigned = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->workerUnassigned->assignRole(UserRole::FieldWorker->value);

        $this->customerUser = User::factory()->create([
            'status'      => UserStatus::Active->value,
            'customer_id' => $this->customer->id,
        ]);
        $this->customerUser->assignRole(UserRole::Customer->value);

        // Create main shipping session
        $this->session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-MOV-001',
            'cargo_name'     => 'Excavator Cat 320',
            'total_quantity' => 2,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        // Initialize 4 checkpoints
        $checkpointService = app(SessionCheckpointService::class);
        $checkpointService->createCheckpointsForSession($this->session, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $checkpoints = SessionCheckpoint::where('shipping_session_id', $this->session->id)
            ->with('checkpoint')
            ->get()
            ->sortBy('checkpoint.sequence')
            ->values();

        $this->step1 = $checkpoints[0];
        $this->step2 = $checkpoints[1];
        $this->step3 = $checkpoints[2];
        $this->step4 = $checkpoints[3];

        // Assign workerPicStep1 as PIC of Step 1 & 2
        $this->step1->update(['pic_user_id' => $this->workerPicStep1->id]);
        $this->step2->update(['pic_user_id' => $this->workerPicStep1->id]);

        // Assign workerPicStep3 as PIC of Step 3 & 4
        $this->step3->update(['pic_user_id' => $this->workerPicStep3->id]);
        $this->step4->update(['pic_user_id' => $this->workerPicStep3->id]);
    }

    // ─── 1. AUTHENTICATION (Tests 1-3) ───────────────────────────────────

    public function test_get_movements_without_token_returns_401(): void
    {
        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_post_movement_without_token_returns_401(): void
    {
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Unauth',
        ]);
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_delete_movement_without_token_returns_401(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Test 1'],
            $this->superAdmin->id
        );

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    // ─── 2. GET AUTHORIZATION (Tests 4-9) ────────────────────────────────

    public function test_super_admin_can_list_movements(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    public function test_supervisor_can_list_movements(): void
    {
        Sanctum::actingAs($this->supervisor);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200);
    }

    public function test_staff_can_list_movements(): void
    {
        Sanctum::actingAs($this->staff);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200);
    }

    public function test_field_worker_can_list_assigned_checkpoint_movements(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200);
    }

    public function test_field_worker_cannot_list_unassigned_checkpoint_movements(): void
    {
        // workerPicStep1 is not PIC of Step 3
        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements");
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.',
            ]);
    }

    public function test_customer_cannot_list_checkpoint_movements(): void
    {
        Sanctum::actingAs($this->customerUser);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(403);
    }

    // ─── 3. SESSION INTEGRITY (Test 10) ──────────────────────────────────

    public function test_checkpoint_from_another_session_returns_404(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-SESSION',
            'cargo_name'     => 'Bulldozer',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        Sanctum::actingAs($this->superAdmin);

        // Query Session A with Checkpoint from Other Session
        $response = $this->getJson("/api/v1/sessions/{$otherSession->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.',
            ]);
    }

    // ─── 4. GET RESOLUTION & REUSE (Tests 11-14) ─────────────────────────

    public function test_step1_returns_actual_tongkang_movements(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Samudra 01'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $tongkang->id)
            ->assertJsonPath('data.0.movement_name', 'Tongkang Samudra 01');
    }

    public function test_step2_returns_exact_same_movement_id_as_step1(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Samudra 01'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $tongkang->id)
            ->assertJsonPath('data.0.movement_name', 'Tongkang Samudra 01');
    }

    public function test_step3_returns_truck_movements(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Samudra 01'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Volvo B 1111 XX',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $truck->id)
            ->assertJsonPath('data.0.movement_name', 'Truk Volvo B 1111 XX')
            ->assertJsonPath('data.0.parent_movement_id', (string) $tongkang->id);
    }

    public function test_step4_returns_exact_same_movement_id_as_step3(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Samudra 01'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Volvo B 1111 XX',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $truck->id)
            ->assertJsonPath('data.0.movement_name', 'Truk Volvo B 1111 XX');
    }

    // ─── 5. CREATE AUTHORIZATION (Tests 15-20) ───────────────────────────

    public function test_super_admin_can_create_allowed_movement(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Permata 01',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.movement_name', 'Tongkang Permata 01');
    }

    public function test_field_worker_pic_can_create_allowed_movement(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Mandiri 01',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.movement_name', 'Tongkang Mandiri 01');
    }

    public function test_field_worker_non_pic_cannot_create_movement(): void
    {
        // workerPicStep3 is not PIC of Step 1
        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Illegal Worker',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.',
            ]);
    }

    public function test_supervisor_cannot_create_movement(): void
    {
        Sanctum::actingAs($this->supervisor);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Supervisor Attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_movement(): void
    {
        Sanctum::actingAs($this->staff);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Staff Attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_customer_cannot_create_movement(): void
    {
        Sanctum::actingAs($this->customerUser);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Customer Attempt',
        ]);

        $response->assertStatus(403);
    }

    // ─── 6. CREATE BUSINESS RULES (Tests 21-28) ──────────────────────────

    public function test_step1_tongkang_creation_succeeds(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Barito 88',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.movement_name', 'Tongkang Barito 88')
            ->assertJsonPath('data.status', 'in_progress');
    }

    public function test_step2_creation_rejected_with_422(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements", [
            'movement_name' => 'Tongkang Fiktif Step 2',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_step3_truck_with_valid_parent_succeeds(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Induk Sah'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements", [
            'movement_name'      => 'Truk Hino B 8888 YY',
            'parent_movement_id' => (string) $tongkang->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.movement_name', 'Truk Hino B 8888 YY')
            ->assertJsonPath('data.parent_movement_id', (string) $tongkang->id);
    }

    public function test_step3_invalid_parent_rejected(): void
    {
        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements", [
            'movement_name'      => 'Truk Hino B 8888 YY',
            'parent_movement_id' => '01nonexistentparentid0000',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_cross_session_parent_rejected(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-002',
            'cargo_name'     => 'Crane',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $checkpointService = app(SessionCheckpointService::class);
        $checkpointService->createCheckpointsForSession($otherSession, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $otherStep1 = SessionCheckpoint::where('shipping_session_id', $otherSession->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->first();

        $otherTongkang = $this->movementService->createMovement(
            $otherSession,
            $otherStep1,
            ['movement_name' => 'Tongkang Sesi Lain'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements", [
            'movement_name'      => 'Truk Cross Session',
            'parent_movement_id' => (string) $otherTongkang->id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_truck_cannot_use_truck_as_parent(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Sah'],
            $this->superAdmin->id
        );

        $truck1 = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Induk 01',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements", [
            'movement_name'      => 'Truk Anak Circular',
            'parent_movement_id' => (string) $truck1->id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_duplicate_movement_name_rejected(): void
    {
        $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Kembar'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'tongkang kembar',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_step4_creation_rejected_with_422(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements", [
            'movement_name' => 'Truk Fiktif Step 4',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    // ─── 7. DELETE AUTHORIZATION (Tests 29-34) ───────────────────────────

    public function test_super_admin_can_delete_eligible_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Deletable SA'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Armada berhasil dihapus.',
            ]);

        $this->assertDatabaseMissing('movements', ['id' => $mov->id]);
    }

    public function test_field_worker_pic_can_delete_eligible_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Deletable PIC'],
            $this->workerPicStep1->id
        );

        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('movements', ['id' => $mov->id]);
    }

    public function test_field_worker_non_pic_cannot_delete_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang PIC Step 1'],
            $this->workerPicStep1->id
        );

        // workerPicStep3 is NOT pic of Step 1
        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda bukan petugas PIC yang berwenang menghapus armada ini.',
            ]);
    }

    public function test_supervisor_cannot_delete_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Prot 1'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->supervisor);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(403);
    }

    public function test_staff_cannot_delete_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Prot 2'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->staff);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(403);
    }

    public function test_customer_cannot_delete_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Prot 3'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->customerUser);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(403);
    }

    // ─── 8. DELETE BUSINESS RULES (Tests 35-38) ──────────────────────────

    public function test_cross_session_movement_cannot_be_deleted(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-003',
            'cargo_name'     => 'Roller',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $checkpointService = app(SessionCheckpointService::class);
        $checkpointService->createCheckpointsForSession($otherSession, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $otherStep1 = SessionCheckpoint::where('shipping_session_id', $otherSession->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->first();

        $mov = $this->movementService->createMovement(
            $otherSession,
            $otherStep1,
            ['movement_name' => 'Tongkang Other Session'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        // Attempt to delete with wrong session in URL
        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Armada tidak ditemukan pada sesi pengiriman ini.',
            ]);
    }

    public function test_movement_with_report_cannot_be_deleted(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang With Report'],
            $this->superAdmin->id
        );

        // Create report for this movement
        $this->movementService->getOrCreateReportForMovement(
            $this->session,
            $this->step1,
            $mov,
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$mov->id}");
        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_tongkang_with_child_truck_cannot_be_deleted(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Parent'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Anak',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$tongkang->id}");
        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_eligible_truck_can_be_deleted(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Induk Aman'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Deletable',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/movements/{$truck->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('movements', ['id' => $truck->id]);
    }

    // ─── 9. RESPONSE CONTRACT (Tests 39-42) ──────────────────────────────

    public function test_success_response_uses_standard_api_envelope(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    public function test_business_exception_uses_standard_422_envelope(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements", [
            'movement_name' => 'Tongkang Fiktif',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'error_code',
            ]);
    }

    public function test_validation_errors_use_standard_422_envelope(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Missing required movement_name
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => [
                    'movement_name',
                ],
            ]);
    }

    public function test_resource_structure_is_correct(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Structure Check'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements");
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'session_checkpoint_id',
                        'movement_name',
                        'movement_type',
                        'parent_movement_id',
                        'parent_name',
                        'sequence',
                        'status',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);
    }

    // ─── 8. MOVEMENT UPDATE / RENAME (Phase 5J.1) ─────────────────────────

    public function test_super_admin_can_update_movement_name(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Lama 01'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->putJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Baru 01']
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.movement_name', 'Tongkang Baru 01')
            ->assertJsonPath('message', 'Armada berhasil diperbarui.');

        $this->assertDatabaseHas('movements', [
            'id'            => $mov->id,
            'movement_name' => 'Tongkang Baru 01',
        ]);
    }

    public function test_field_worker_pic_can_update_movement_name(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Step 1 Original'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Step 1 Renamed']
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.movement_name', 'Tongkang Step 1 Renamed');
    }

    public function test_field_worker_non_pic_cannot_update_movement_name(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Secure'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3); // Worker 3 is not PIC of Step 1

        $response = $this->putJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Hacked']
        );

        $response->assertStatus(403);
    }

    public function test_duplicate_movement_name_on_update_rejected(): void
    {
        $mov1 = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Alpha'],
            $this->superAdmin->id
        );

        $mov2 = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Beta'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        // Attempting to rename mov2 to 'Tongkang Alpha'
        $response = $this->putJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov2->id}",
            ['movement_name' => 'Tongkang Alpha']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_completed_movement_cannot_be_updated(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Completed'],
            $this->superAdmin->id
        );
        $mov->update(['status' => \App\Enums\MovementStatus::COMPLETED]);

        Sanctum::actingAs($this->superAdmin);

        $response = $this->putJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Rename Try']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_cross_session_movement_update_rejected(): void
    {
        $sessionOther = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-001',
            'cargo_name'     => 'Cargo Other',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Real'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        $response = $this->putJson(
            "/api/v1/sessions/{$sessionOther->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Tampered']
        );

        $response->assertStatus(404)
            ->assertJsonPath('error_code', 'NOT_FOUND');
    }

    public function test_supervisor_cannot_update_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Spv Block'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->supervisor);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Spv Edit']
        );

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'FORBIDDEN');
    }

    public function test_staff_cannot_update_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Staff Block'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->staff);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Staff Edit']
        );

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'FORBIDDEN');
    }

    public function test_customer_cannot_update_movement(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Cust Block'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->customerUser);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Cust Edit']
        );

        $response->assertStatus(403)
            ->assertJsonPath('error_code', 'FORBIDDEN');
    }

    public function test_completed_checkpoint_movement_cannot_be_updated(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Completed Checkpoint'],
            $this->superAdmin->id
        );
        $this->step1->update(['status' => \App\Enums\SessionCheckpointStatus::COMPLETED]);

        Sanctum::actingAs($this->superAdmin);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Checkpoint Completed Edit']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_skipped_checkpoint_movement_cannot_be_updated(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Skipped Checkpoint'],
            $this->superAdmin->id
        );
        $this->step1->update(['status' => \App\Enums\SessionCheckpointStatus::SKIPPED]);

        Sanctum::actingAs($this->superAdmin);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Checkpoint Skipped Edit']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_delivered_session_movement_cannot_be_updated(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Delivered Session'],
            $this->superAdmin->id
        );
        $this->session->update(['status' => ShippingSessionStatus::DELIVERED]);

        Sanctum::actingAs($this->superAdmin);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => 'Tongkang Delivered Edit']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_update_cannot_mutate_parent_movement_or_movement_type(): void
    {
        $tongkang = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Induk'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Anak 01',
                'parent_movement_id' => $tongkang->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$truck->id}",
            [
                'movement_name'      => 'Truk Anak Renamed',
                'parent_movement_id' => '01fake-parent-id',
                'movement_type'      => 'Tongkang',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.movement_name', 'Truk Anak Renamed')
            ->assertJsonPath('data.parent_movement_id', $tongkang->id)
            ->assertJsonPath('data.movement_type', 'hauling');

        $truck->refresh();
        $this->assertEquals($tongkang->id, $truck->parent_movement_id);
        $this->assertEquals(\App\Enums\MovementType::HAULING, $truck->movement_type);
    }

    public function test_movement_name_validation_on_update(): void
    {
        $mov = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Valid'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        // Missing movement_name
        $respMissing = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            []
        );
        $respMissing->assertStatus(422)
            ->assertJsonValidationErrors(['movement_name']);

        // Empty movement_name
        $respEmpty = $this->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$mov->id}",
            ['movement_name' => '   ']
        );
        $respEmpty->assertStatus(422);
    }
}
