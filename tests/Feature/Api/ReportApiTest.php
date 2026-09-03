<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\MovementStatus;
use App\Enums\ReportStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
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

class ReportApiTest extends TestCase
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

    private Movement $tongkang1;
    private MovementService $movementService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->movementService = app(MovementService::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Kalimantex Mining',
            'pic_name'     => 'Danang',
            'email'        => 'danang@kalimantex.com',
            'phone'        => '08123456788',
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
            'assignment_no'  => 'TRK-REP-001',
            'cargo_name'     => 'Mining Dozer D375',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

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

        // Assign PICs
        $this->step1->update(['pic_user_id' => $this->workerPicStep1->id]);
        $this->step2->update(['pic_user_id' => $this->workerPicStep1->id]);

        $this->step3->update(['pic_user_id' => $this->workerPicStep3->id]);
        $this->step4->update(['pic_user_id' => $this->workerPicStep3->id]);

        // Register initial Tongkang in Step 1
        $this->tongkang1 = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Oceanic 01'],
            $this->superAdmin->id
        );
    }

    // ─── 1. AUTHENTICATION (Tests 1-3) ───────────────────────────────────

    public function test_get_report_without_token_returns_401(): void
    {
        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_post_report_without_token_returns_401(): void
    {
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => -1.26,
        ]);
        $response->assertStatus(401);
    }

    public function test_complete_report_without_token_returns_401(): void
    {
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/complete");
        $response->assertStatus(401);
    }

    // ─── 2. ROLE & PIC AUTHORIZATION (Tests 4-15) ────────────────────────

    public function test_super_admin_can_view_report(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'session_checkpoint_id',
                    'movement_id',
                    'status',
                    'values',
                    'photos',
                ],
            ]);
    }

    public function test_supervisor_can_view_report(): void
    {
        Sanctum::actingAs($this->supervisor);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(200);
    }

    public function test_staff_can_view_report(): void
    {
        Sanctum::actingAs($this->staff);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(200);
    }

    public function test_field_worker_pic_can_view_report(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(200);
    }

    public function test_field_worker_non_pic_cannot_view_report(): void
    {
        // workerPicStep3 is not PIC of Step 1
        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.',
            ]);
    }

    public function test_customer_cannot_view_report(): void
    {
        Sanctum::actingAs($this->customerUser);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(403);
    }

    public function test_super_admin_can_save_report(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude'  => -1.2653,
            'longitude' => 116.8312,
            'fields'    => [
                'nama_mv' => 'MV Pioneer',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.latitude', -1.2653)
            ->assertJsonPath('data.longitude', 116.8312)
            ->assertJsonPath('data.values.nama_mv', 'MV Pioneer');
    }

    public function test_supervisor_cannot_save_report(): void
    {
        Sanctum::actingAs($this->supervisor);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => -1.2653,
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_save_report(): void
    {
        Sanctum::actingAs($this->staff);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => -1.2653,
        ]);

        $response->assertStatus(403);
    }

    public function test_field_worker_pic_can_save_report(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude'  => -1.2653,
            'longitude' => 116.8312,
            'fields'    => [
                'nama_mv' => 'MV Pioneer',
            ],
        ]);

        $response->assertStatus(200);
    }

    public function test_field_worker_non_pic_cannot_save_report(): void
    {
        Sanctum::actingAs($this->workerPicStep3);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => -1.2653,
        ]);

        $response->assertStatus(403);
    }

    public function test_customer_cannot_save_report(): void
    {
        Sanctum::actingAs($this->customerUser);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => -1.2653,
        ]);

        $response->assertStatus(403);
    }

    // ─── 3. SESSION & CHECKPOINT INTEGRITY (Tests 16-18) ─────────────────

    public function test_checkpoint_from_another_session_returns_404(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-REP-01',
            'cargo_name'     => 'Roller',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$otherSession->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(404);
    }

    public function test_cross_session_movement_returns_422(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-REP-02',
            'cargo_name'     => 'Grader',
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
            ['movement_name' => 'Tongkang Sesi Sebelah'],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->superAdmin);

        // Attempt to access report on Session 1 using otherTongkang
        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$otherTongkang->id}/report");
        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    // ─── 4. STEP 2 & STEP 4 REPORT ISOLATION (Tests 19-20) ───────────────

    public function test_step2_reuses_step1_movement_id_with_isolated_report(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // 1. Save data in Step 1 report
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'fields' => ['nama_mv' => 'MV Step 1 Exclusive'],
        ])->assertStatus(200);

        // 2. Fetch Step 2 report for the EXACT SAME movement
        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements/{$this->tongkang1->id}/report");
        $response->assertStatus(200)
            ->assertJsonPath('data.session_checkpoint_id', (string) $this->step2->id)
            ->assertJsonPath('data.movement_id', (string) $this->tongkang1->id);

        // Values of Step 2 must be isolated (not containing Step 1's nama_mv)
        $this->assertArrayNotHasKey('nama_mv', $response->json('data.values') ?? []);
    }

    public function test_step4_reuses_step3_movement_id_with_isolated_report(): void
    {
        // Create Truck in Step 3
        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Volvo B 7777 XX',
                'parent_movement_id' => $this->tongkang1->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        // Save Step 3 report
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements/{$truck->id}/report", [
            'fields' => ['no_polisi' => 'B 7777 XX'],
        ])->assertStatus(200);

        // Fetch Step 4 report for the same truck
        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements/{$truck->id}/report");
        $response->assertStatus(200)
            ->assertJsonPath('data.session_checkpoint_id', (string) $this->step4->id)
            ->assertJsonPath('data.movement_id', (string) $truck->id);

        // Step 4 is isolated from Step 3 values
        $this->assertArrayNotHasKey('no_polisi', $response->json('data.values') ?? []);
    }

    // ─── 5. GPS VALIDATION (Tests 21-23) ─────────────────────────────────

    public function test_invalid_latitude_rejected_with_422(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude' => 95.5, // invalid: max is 90
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);
    }

    public function test_invalid_longitude_rejected_with_422(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'longitude' => -195.0, // invalid: min is -180
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['longitude']);
    }

    public function test_valid_gps_and_event_at_stored_successfully(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude'  => -1.265386,
            'longitude' => 116.831200,
            'event_at'  => '2026-09-03T10:00:00Z',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.latitude', -1.265386)
            ->assertJsonPath('data.longitude', 116.8312);
    }

    // ─── 6. COMPLETION REQUIREMENTS & IMMUTABILITY (Tests 24-28) ──────────

    public function test_completion_fails_if_required_fields_missing(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Missing CIQP Status & photos
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/complete");

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_completion_succeeds_when_all_requirements_met(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // 1. Populate all required fields, photos, and GPS
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude'  => -1.265386,
            'longitude' => 116.831200,
            'event_at'  => '2026-09-03T10:00:00Z',
            'fields'    => [
                'nama_mv'       => 'MV Oceanic Pioneer',
                'nama_tongkang' => 'Tongkang Oceanic 01',
                'ciqp_status'   => 'CLEARED',
            ],
            'photos'    => [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
        ])->assertStatus(200);

        // 2. Complete report
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/complete");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Verify movement status synchronized to completed
        $this->tongkang1->refresh();
        $this->assertEquals(MovementStatus::COMPLETED, $this->tongkang1->status);
    }

    public function test_completed_report_is_immutable(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // 1. Complete report
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'latitude'  => -1.265386,
            'longitude' => 116.831200,
            'event_at'  => '2026-09-03T10:00:00Z',
            'fields'    => [
                'nama_mv'       => 'MV Oceanic Pioneer',
                'nama_tongkang' => 'Tongkang Oceanic 01',
                'ciqp_status'   => 'CLEARED',
            ],
            'photos'    => [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
        ])->assertStatus(200);

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/complete")
            ->assertStatus(200);

        // 2. Attempt to mutate the completed report
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report", [
            'fields' => ['nama_mv' => 'Hacked MV Name'],
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }
}
