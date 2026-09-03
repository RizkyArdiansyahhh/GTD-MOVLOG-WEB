<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApiEndToEndOperationalTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $supervisor;
    private User $staff;
    private User $workerPicStep1And2;
    private User $workerPicStep3And4;
    private User $workerUnassigned;
    private User $customerUser;
    private Customer $customer;

    private ShippingSession $session;
    private SessionCheckpoint $step1;
    private SessionCheckpoint $step2;
    private SessionCheckpoint $step3;
    private SessionCheckpoint $step4;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Sumber Makmur Logistik',
            'pic_name'     => 'Bambang',
            'email'        => 'bambang@sumbermakmur.co.id',
            'phone'        => '081122334455',
        ]);

        $this->superAdmin = User::factory()->create([
            'email'    => 'admin@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->supervisor = User::factory()->create([
            'email'    => 'spv@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->supervisor->assignRole(UserRole::Supervisor->value);

        $this->staff = User::factory()->create([
            'email'    => 'staff@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->staff->assignRole(UserRole::Staff->value);

        $this->workerPicStep1And2 = User::factory()->create([
            'email'    => 'worker1@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->workerPicStep1And2->assignRole(UserRole::FieldWorker->value);

        $this->workerPicStep3And4 = User::factory()->create([
            'email'    => 'worker2@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->workerPicStep3And4->assignRole(UserRole::FieldWorker->value);

        $this->workerUnassigned = User::factory()->create([
            'email'    => 'unassigned@gtd.test',
            'password' => Hash::make('Secret123!'),
            'status'   => UserStatus::Active->value,
        ]);
        $this->workerUnassigned->assignRole(UserRole::FieldWorker->value);

        $this->customerUser = User::factory()->create([
            'email'       => 'cust@gtd.test',
            'password'    => Hash::make('Secret123!'),
            'status'      => UserStatus::Active->value,
            'customer_id' => $this->customer->id,
        ]);
        $this->customerUser->assignRole(UserRole::Customer->value);

        // Initialize session
        $this->session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-E2E-2026-001',
            'cargo_name'     => 'Turbine Generator 50MW',
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

        // Assign PICs: Worker 1 for Step 1 & 2, Worker 2 for Step 3 & 4
        $this->step1->update(['pic_user_id' => $this->workerPicStep1And2->id]);
        $this->step2->update(['pic_user_id' => $this->workerPicStep1And2->id]);
        $this->step3->update(['pic_user_id' => $this->workerPicStep3And4->id]);
        $this->step4->update(['pic_user_id' => $this->workerPicStep3And4->id]);
    }

    /**
     * Complete positive End-to-End Operational Pipeline:
     * Login -> Step 1 -> Step 2 -> Step 3 -> Step 4 -> Session DELIVERED
     */
    public function test_complete_operational_pipeline_from_login_to_delivered(): void
    {
        // ─── 1. API LOGIN & AUTHENTICATION ──────────────────────────────────
        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'worker1@gtd.test',
            'password' => 'Secret123!',
        ]);

        $loginResp->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user']]);

        $tokenWorker1 = $loginResp->json('data.token');
        $headersWorker1 = ['Authorization' => "Bearer {$tokenWorker1}"];

        // Verify /me endpoint
        $meResp = $this->withHeaders($headersWorker1)->getJson('/api/v1/auth/me');
        $meResp->assertStatus(200)
            ->assertJsonPath('data.email', 'worker1@gtd.test');

        // Worker 2 Login
        $this->flushSession();
        app('auth')->forgetGuards();
        $loginResp2 = $this->postJson('/api/v1/auth/login', [
            'email'    => 'worker2@gtd.test',
            'password' => 'Secret123!',
        ]);
        $tokenWorker2 = $loginResp2->json('data.token');
        $headersWorker2 = ['Authorization' => "Bearer {$tokenWorker2}"];

        // ─── 2. RETRIEVE SESSION & STEP 1 CHECKPOINT ────────────────────────
        $sessionResp = $this->withHeaders($headersWorker1)->getJson("/api/v1/sessions/{$this->session->id}");
        $sessionResp->assertStatus(200)
            ->assertJsonPath('data.assignment_no', 'TRK-E2E-2026-001');

        $step1Resp = $this->withHeaders($headersWorker1)->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}");
        $step1Resp->assertStatus(200)
            ->assertJsonPath('data.sequence', 1)
            ->assertJsonPath('data.status', 'in_progress');

        // ─── 3. STEP 1: CREATE TONGKANG & UPLOAD INSPECTION PHOTOS ──────────
        $mov1Resp = $this->withHeaders($headersWorker1)->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements", [
            'movement_name' => 'Tongkang Oceanic 88',
        ]);
        $mov1Resp->assertStatus(201);
        $tongkangId = $mov1Resp->json('data.id');
        $this->assertNotEmpty($tongkangId);

        // Upload 4 required photo slots for Step 1
        $step1PhotoSlots = [
            'foto_equipment_lct',
            'foto_ciqp_approval',
            'foto_lashing_tongkang',
            'foto_barge_cast_off',
        ];

        foreach ($step1PhotoSlots as $slotKey) {
            $photoFile = UploadedFile::fake()->image("{$slotKey}.jpg", 640, 480);
            $photoResp = $this->withHeaders($headersWorker1)->postJson(
                "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$tongkangId}/report/photos",
                [
                    'photo'     => $photoFile,
                    'field_key' => $slotKey,
                    'caption'   => "Foto {$slotKey}",
                ]
            );
            $photoResp->assertStatus(201);
        }

        // Save Step 1 form fields, GPS, and timestamp
        $report1Resp = $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$tongkangId}/report",
            [
                'latitude'  => -1.265386,
                'longitude' => 116.831200,
                'event_at'  => '2026-09-03T08:00:00Z',
                'fields'    => [
                    'nama_mv'       => 'MV Oceanic Pioneer',
                    'nama_tongkang' => 'Tongkang Oceanic 88',
                    'ciqp_status'   => 'CLEARED',
                ],
            ]
        );
        $report1Resp->assertStatus(200);

        // Complete Step 1 Report
        $completeRep1Resp = $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$tongkangId}/report/complete"
        );
        $completeRep1Resp->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Complete Step 1 Checkpoint via API
        $completeChk1Resp = $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );
        $completeChk1Resp->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Verify Step 1 is COMPLETED and Step 2 is auto-activated to IN_PROGRESS
        $this->step1->refresh();
        $this->step2->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $this->step1->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $this->step2->status);

        // ─── 4. STEP 2: REUSE STEP 1 MOVEMENT & ISOLATED REPORT ──────────────
        $step2MovsResp = $this->withHeaders($headersWorker1)->getJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements"
        );
        $step2MovsResp->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $tongkangId); // EXACT SAME Movement ID!

        // Upload 4 required photo slots for Step 2
        $step2PhotoSlots = [
            'foto_crane_sling_prep',
            'foto_berthing_pelindo',
            'foto_discharge_port',
            'foto_cargo_temporary_storage',
        ];

        foreach ($step2PhotoSlots as $slotKey) {
            $photoFile = UploadedFile::fake()->image("{$slotKey}.jpg", 640, 480);
            $this->withHeaders($headersWorker1)->postJson(
                "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements/{$tongkangId}/report/photos",
                [
                    'photo'     => $photoFile,
                    'field_key' => $slotKey,
                ]
            )->assertStatus(201);
        }

        // Save Step 2 report fields & GPS
        $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements/{$tongkangId}/report",
            [
                'latitude'  => -1.250000,
                'longitude' => 116.820000,
                'event_at'  => '2026-09-03T12:00:00Z',
                'fields'    => [
                    'dermaga_pelindo' => 'Dermaga Semayang',
                    'waktu_sandar'    => '2026-09-03T11:45:00Z',
                    'lokasi_storage'  => 'Lapangan Penumpukan Blok C',
                ],
            ]
        )->assertStatus(200);

        // Complete Step 2 Report
        $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements/{$tongkangId}/report/complete"
        )->assertStatus(200);

        // Complete Step 2 Checkpoint
        $this->withHeaders($headersWorker1)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/complete"
        )->assertStatus(200);

        $this->step2->refresh();
        $this->step3->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $this->step2->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $this->step3->status);

        // Verify Step 1 and Step 2 have isolated separate Report records
        $step1Report = Report::where('session_checkpoint_id', $this->step1->id)->where('movement_id', $tongkangId)->first();
        $step2Report = Report::where('session_checkpoint_id', $this->step2->id)->where('movement_id', $tongkangId)->first();
        $this->assertNotNull($step1Report);
        $this->assertNotNull($step2Report);
        $this->assertNotEquals($step1Report->id, $step2Report->id);

        // ─── 5. STEP 3: CREATE TRUCK WITH PARENT TONGKANG ───────────────────
        app('auth')->forgetGuards();
        $mov3Resp = $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements",
            [
                'movement_name'      => 'Truk Volvo Heavy Hauler B 8888 GTD',
                'parent_movement_id' => $tongkangId, // Parent is Step 1 Tongkang
            ]
        );
        $mov3Resp->assertStatus(201)
            ->assertJsonPath('data.parent_movement_id', $tongkangId);

        $truckId = $mov3Resp->json('data.id');

        // Upload 7 required photo slots for Step 3
        $step3PhotoSlots = [
            'foto_truk_depan',
            'foto_truk_samping',
            'foto_sim_supir',
            'foto_stnk_truk',
            'foto_lashing_truk',
            'foto_truk_berangkat',
            'foto_surat_jalan',
        ];

        foreach ($step3PhotoSlots as $slotKey) {
            $photoFile = UploadedFile::fake()->image("{$slotKey}.jpg", 640, 480);
            $this->withHeaders($headersWorker2)->postJson(
                "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements/{$truckId}/report/photos",
                [
                    'photo'     => $photoFile,
                    'field_key' => $slotKey,
                ]
            )->assertStatus(201);
        }

        // Save Step 3 report fields & GPS
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements/{$truckId}/report",
            [
                'latitude'  => -1.240000,
                'longitude' => 116.810000,
                'event_at'  => '2026-09-03T15:00:00Z',
                'fields'    => [
                    'license_plate'      => 'B 8888 GTD',
                    'driver_name'        => 'Joko Susanto',
                    'packing_list_item'  => 'Turbine Casing & Rotor',
                ],
            ]
        )->assertStatus(200);

        // Complete Step 3 Report
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements/{$truckId}/report/complete"
        )->assertStatus(200);

        // Complete Step 3 Checkpoint
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/complete"
        )->assertStatus(200);

        $this->step3->refresh();
        $this->step4->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $this->step3->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $this->step4->status);

        // ─── 6. STEP 4: REUSE TRUCK, FINAL SITE REPORT & POD ─────────────────
        $step4MovsResp = $this->withHeaders($headersWorker2)->getJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements"
        );
        $step4MovsResp->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $truckId); // EXACT SAME Truck Movement ID!

        // Upload Step 4 required photo slot
        $photoFile = UploadedFile::fake()->image('foto_surat_jalan_ttd_cap.jpg', 640, 480);
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements/{$truckId}/report/photos",
            [
                'photo'     => $photoFile,
                'field_key' => 'foto_surat_jalan_ttd_cap',
            ]
        )->assertStatus(201);

        // Save Step 4 fields & GPS
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements/{$truckId}/report",
            [
                'latitude'  => -1.180000,
                'longitude' => 116.750000,
                'event_at'  => '2026-09-03T19:30:00Z',
                'fields'    => [
                    'nama_penerima_site' => 'Ir. Hendra (Site Manager)',
                    'kondisi_barang'     => 'Diterima dalam kondisi baik dan lengkap',
                ],
            ]
        )->assertStatus(200);

        // Complete Step 4 Report
        $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements/{$truckId}/report/complete"
        )->assertStatus(200);

        // ─── 7. FINAL CHECKPOINT COMPLETION & DELIVERED PROPAGATION ──────────
        $completeChk4Resp = $this->withHeaders($headersWorker2)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/complete"
        );
        $completeChk4Resp->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $this->step4->refresh();
        $this->session->refresh();

        // Verify Step 4 = COMPLETED and ShippingSession = DELIVERED
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $this->step4->status);
        $this->assertEquals(ShippingSessionStatus::DELIVERED, $this->session->status);

        // Verify session detail via API reflects DELIVERED
        $finalSessionResp = $this->withHeaders($headersWorker1)->getJson("/api/v1/sessions/{$this->session->id}");
        $finalSessionResp->assertStatus(200)
            ->assertJsonPath('data.status', 'delivered')
            ->assertJsonPath('data.status_label', 'Selesai');
    }

    // ─── 8. REQUIRED NEGATIVE SCENARIOS ──────────────────────────────────

    public function test_non_pic_worker_cannot_complete_checkpoint(): void
    {
        // workerUnassigned is NOT PIC of Step 1
        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'unassigned@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_checkpoint_with_zero_movements_cannot_complete(): void
    {
        // workerPicStep1 is PIC, but zero movements registered yet
        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'worker1@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_checkpoint_with_incomplete_report_cannot_complete(): void
    {
        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'worker1@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        // Register movement
        $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Incomplete 01']
        )->assertStatus(201);

        // Attempt to complete checkpoint without completing report
        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_completed_checkpoint_cannot_be_completed_again(): void
    {
        // Manually complete step 1
        $this->step1->update([
            'status' => SessionCheckpointStatus::COMPLETED,
        ]);

        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_delivered_session_cannot_complete_checkpoint(): void
    {
        $this->session->update(['status' => ShippingSessionStatus::DELIVERED]);
        $this->step1->update(['status' => SessionCheckpointStatus::COMPLETED]);

        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_customer_can_read_delivered_session_but_cannot_complete_checkpoint(): void
    {
        $this->session->update(['status' => ShippingSessionStatus::DELIVERED]);

        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'cust@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        // Customer can read own DELIVERED session
        $readResp = $this->withHeaders($headers)->getJson("/api/v1/sessions/{$this->session->id}");
        $readResp->assertStatus(200)
            ->assertJsonPath('data.status', 'delivered');

        // Customer cannot complete checkpoint
        $completeResp = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete"
        );
        $completeResp->assertStatus(403);
    }

    public function test_completed_checkpoint_cannot_register_new_movement(): void
    {
        $this->step1->update(['status' => SessionCheckpointStatus::COMPLETED]);

        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Late Tongkang']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_delivered_session_cannot_register_new_movement(): void
    {
        $this->session->update(['status' => ShippingSessionStatus::DELIVERED]);

        $loginResp = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@gtd.test',
            'password' => 'Secret123!',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $loginResp->json('data.token')];

        $response = $this->withHeaders($headers)->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Post Delivery Tongkang']
        );

        $response->assertStatus(422)
            ->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    public function test_api_403_and_404_responses_contain_consistent_error_code(): void
    {
        // 403 HttpException
        $resp403 = $this->getJson('/api/v1/test-foundation/forbidden');
        $resp403->assertStatus(403)
            ->assertJsonPath('error_code', 'FORBIDDEN');

        // 404 HttpException
        $resp404 = $this->getJson('/api/v1/nonexistent-route');
        $resp404->assertStatus(404)
            ->assertJsonPath('error_code', 'NOT_FOUND');
    }
}
