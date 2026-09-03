<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\ReportPhoto;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportPhotoApiTest extends TestCase
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

        Storage::fake('public');

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->movementService = app(MovementService::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Trans Borneo Logistics',
            'pic_name'     => 'Fajar',
            'email'        => 'fajar@transborneo.com',
            'phone'        => '08123456781',
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
            'assignment_no'  => 'TRK-PHT-001',
            'cargo_name'     => 'Excavator Cat 330',
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
            ['movement_name' => 'Tongkang Bahari 01'],
            $this->superAdmin->id
        );
    }

    // ─── 1. AUTHENTICATION & AUTHORIZATION (Tests 1-8) ───────────────────

    public function test_unauthenticated_upload_and_delete_return_401(): void
    {
        $file = UploadedFile::fake()->image('test.jpg');

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(401);

        $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos/01fakeid000000000000000000")
            ->assertStatus(401);
    }

    public function test_super_admin_can_upload_and_delete_photo(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $file = UploadedFile::fake()->image('equipment.jpg', 600, 400);

        // Upload
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
            'caption'   => 'Equipment di atas tongkang',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.field_key', 'foto_equipment_lct')
            ->assertJsonPath('data.caption', 'Equipment di atas tongkang');

        $photoId = $response->json('data.id');
        $this->assertDatabaseHas('report_photos', ['id' => $photoId]);

        // Delete
        $deleteResp = $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos/{$photoId}");
        $deleteResp->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('report_photos', ['id' => $photoId]);
    }

    public function test_field_worker_pic_can_upload_and_delete_photo(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $file = UploadedFile::fake()->image('ciqp.jpg', 800, 600);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_ciqp_approval',
        ]);

        $response->assertStatus(201);
        $photoId = $response->json('data.id');

        $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos/{$photoId}")
            ->assertStatus(200);
    }

    public function test_field_worker_non_pic_cannot_upload_or_delete(): void
    {
        // workerPicStep3 is not PIC of Step 1
        Sanctum::actingAs($this->workerPicStep3);

        $file = UploadedFile::fake()->image('test.jpg');

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(403);
    }

    public function test_supervisor_cannot_upload_or_delete_photo(): void
    {
        Sanctum::actingAs($this->supervisor);

        $file = UploadedFile::fake()->image('test.jpg');

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(403);
    }

    public function test_staff_cannot_upload_or_delete_photo(): void
    {
        Sanctum::actingAs($this->staff);

        $file = UploadedFile::fake()->image('test.jpg');

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(403);
    }

    public function test_customer_cannot_upload_or_delete_photo(): void
    {
        Sanctum::actingAs($this->customerUser);

        $file = UploadedFile::fake()->image('test.jpg');

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(403);
    }

    // ─── 2. HIERARCHY & INTEGRITY (Tests 9-11) ───────────────────────────

    public function test_cross_session_photo_upload_rejected(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-PHT-01',
            'cargo_name'     => 'Roller',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        Sanctum::actingAs($this->superAdmin);

        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson("/api/v1/sessions/{$otherSession->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);

        $response->assertStatus(404);
    }

    public function test_invalid_photo_slot_rejected_with_422(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'slot_fiktif_yang_tidak_ada',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_cross_report_photo_delete_rejected(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Upload photo on Tongkang 1
        $file = UploadedFile::fake()->image('test.jpg');
        $resp = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);
        $photoId = $resp->json('data.id');

        // Create Tongkang 2
        $tongkang2 = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Bahari 02'],
            $this->superAdmin->id
        );

        // Attempt to delete photoId using Tongkang 2 route -> must be 422 / not found on that report
        $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$tongkang2->id}/report/photos/{$photoId}")
            ->assertStatus(422);
    }

    // ─── 3. FILE VALIDATION (Tests 12-14) ────────────────────────────────

    public function test_non_image_file_rejected_with_422(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $file = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_oversized_file_rejected_with_422(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // 12MB file (exceeds max 10MB)
        $file = UploadedFile::fake()->create('big_image.jpg', 12000, 'image/jpeg');

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_valid_png_image_succeeds(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $file = UploadedFile::fake()->image('picture.png', 800, 600);

        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);

        $response->assertStatus(201);
    }

    public function test_failed_db_transaction_cleans_new_file(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Make movement invalid by changing status of session or report to completed right before DB write
        // Or mock/simulate exception during uploadReportPhoto
        $mockService = \Mockery::mock(MovementService::class)->makePartial();
        $mockService->shouldReceive('uploadReportPhoto')
            ->once()
            ->andThrow(new \RuntimeException('Simulated DB Crash'));
        $this->app->instance(MovementService::class, $mockService);

        $file = UploadedFile::fake()->image('will_be_cleaned.jpg', 600, 400);

        try {
            $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
                'photo'     => $file,
                'field_key' => 'foto_equipment_lct',
            ]);
        } catch (\RuntimeException $e) {
            // Caught
        }

        // Storage disk must be empty (file deleted because DB failed)
        $allFiles = Storage::disk('public')->allFiles('reports/photos');
        $this->assertEmpty($allFiles);
    }

    // ─── 4. REPLACEMENT & STORAGE CLEANUP (Tests 15-18) ──────────────────

    public function test_uploading_to_existing_slot_replaces_photo_and_cleans_old_file(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // 1. First upload
        $file1 = UploadedFile::fake()->image('first.jpg', 600, 400);
        $resp1 = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file1,
            'field_key' => 'foto_ciqp_approval',
            'caption'   => 'First upload',
        ]);
        $resp1->assertStatus(201);
        $url1 = $resp1->json('data.photo_url');
        $path1 = parse_url($url1, PHP_URL_PATH);
        $relPath1 = str_replace('/storage/', '', $path1);

        Storage::disk('public')->assertExists($relPath1);

        // Exactly 1 photo in DB for this slot
        $this->assertEquals(1, ReportPhoto::count());

        // 2. Second upload to the EXACT SAME slot
        $file2 = UploadedFile::fake()->image('second_clear.jpg', 1200, 800);
        $resp2 = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file2,
            'field_key' => 'foto_ciqp_approval',
            'caption'   => 'Second clear upload',
        ]);
        $resp2->assertStatus(201);
        $url2 = $resp2->json('data.photo_url');
        $relPath2 = str_replace('/storage/', '', parse_url($url2, PHP_URL_PATH));

        // Exactly 1 photo row in DB (enforcing 1 active photo per slot!)
        $this->assertEquals(1, ReportPhoto::count());
        $this->assertEquals('Second clear upload', ReportPhoto::first()->caption);

        // Old file must be cleaned up from storage
        Storage::disk('public')->assertMissing($relPath1);
        // New file must exist
        Storage::disk('public')->assertExists($relPath2);
    }

    public function test_deleting_photo_removes_db_record_and_storage_file(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        $file = UploadedFile::fake()->image('delete_me.jpg');
        $resp = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_lashing_tongkang',
        ]);

        $photoId = $resp->json('data.id');
        $relPath = str_replace('/storage/', '', parse_url($resp->json('data.photo_url'), PHP_URL_PATH));

        Storage::disk('public')->assertExists($relPath);

        // Delete photo
        $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos/{$photoId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('report_photos', ['id' => $photoId]);
        Storage::disk('public')->assertMissing($relPath);
    }

    // ─── 5. COMPLETED REPORT IMMUTABILITY (Tests 19-20) ───────────────────

    public function test_completed_report_cannot_upload_new_photo(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Complete the report
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

        // Attempt upload on completed report
        $file = UploadedFile::fake()->image('late.jpg');
        $response = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    public function test_completed_report_cannot_delete_photo(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Upload a photo first
        $file = UploadedFile::fake()->image('test.jpg');
        $resp = $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file,
            'field_key' => 'foto_equipment_lct',
        ]);
        $photoId = $resp->json('data.id');

        // Complete the report
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
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
        ])->assertStatus(200);

        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/complete")
            ->assertStatus(200);

        // Attempt delete on completed report
        $response = $this->deleteJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos/{$photoId}");

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    // ─── 6. STEP 2 & STEP 4 REPORT PHOTO ISOLATION (Tests 21-22) ──────────

    public function test_step2_photo_upload_is_isolated_from_step1(): void
    {
        Sanctum::actingAs($this->workerPicStep1);

        // Upload photo in Step 1
        $file1 = UploadedFile::fake()->image('step1.jpg');
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file1,
            'field_key' => 'foto_equipment_lct',
        ])->assertStatus(201);

        // Upload photo in Step 2 for the exact same movement
        $file2 = UploadedFile::fake()->image('step2.jpg');
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements/{$this->tongkang1->id}/report/photos", [
            'photo'     => $file2,
            'field_key' => 'foto_berthing_pelindo',
        ])->assertStatus(201);

        // Total 2 photos in DB across 2 distinct reports
        $this->assertEquals(2, ReportPhoto::count());
    }

    public function test_step4_photo_upload_is_isolated_from_step3(): void
    {
        // Create Truck in Step 3
        $truck = $this->movementService->createMovement(
            $this->session,
            $this->step3,
            [
                'movement_name'      => 'Truk Scania B 9999 XX',
                'parent_movement_id' => $this->tongkang1->id,
            ],
            $this->superAdmin->id
        );

        Sanctum::actingAs($this->workerPicStep3);

        // Step 3 photo
        $file3 = UploadedFile::fake()->image('step3.jpg');
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements/{$truck->id}/report/photos", [
            'photo'     => $file3,
            'field_key' => 'foto_lashing_truk',
        ])->assertStatus(201);

        // Step 4 photo for same truck
        $file4 = UploadedFile::fake()->image('step4.jpg');
        $this->postJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step4->id}/movements/{$truck->id}/report/photos", [
            'photo'     => $file4,
            'field_key' => 'foto_surat_jalan_ttd_cap',
        ])->assertStatus(201);

        // Both photos exist in independent report rows
        $this->assertEquals(2, ReportPhoto::count());
    }
}
