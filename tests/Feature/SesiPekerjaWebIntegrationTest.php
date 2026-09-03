<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SesiPekerjaWebIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private Customer $customer;
    private MovementService $movementService;
    private SessionCheckpointService $checkpointService;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.testing.ensure_pages_exist' => false]);

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Web Integration Test',
            'pic_name'     => 'Budi Web',
            'email'        => 'budi@web.com',
            'phone'        => '081299998888',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->movementService = app(MovementService::class);
        $this->checkpointService = app(SessionCheckpointService::class);
    }

    private function createTestSession(string $ref = 'SES-WEB-001'): array
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => $ref,
            'cargo_name'     => 'Excavator CAT 320D',
            'total_quantity' => 2,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
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

    /** TEST 1: Super Admin can view session show page with stages and movement structure */
    public function test_super_admin_can_view_session_show_page(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-001');

        $response = $this->actingAs($this->superAdmin)->get("/sesi-pekerja/{$session->id}");

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('KelolaSesi/Show')
                ->where('session.sessionId', 'SES-WEB-001')
                ->has('session.stages', 4)
                ->where('session.stages.0.stage_name', 'Kapal')
                ->where('session.stages.0.can_add_movement', true)
                ->where('session.stages.1.stage_name', 'Tongkang')
                ->where('session.stages.1.can_add_movement', false)
                ->where('session.stages.2.stage_name', 'Pelabuhan')
                ->where('session.stages.2.can_add_movement', true)
                ->where('session.stages.3.stage_name', 'Site')
                ->where('session.stages.3.can_add_movement', false)
            );
    }

    /** TEST 2: Super Admin can batch assign all stage pics */
    public function test_super_admin_can_batch_assign_all_stage_pics(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-001B');

        $worker = User::factory()->create(['status' => UserStatus::Active->value]);
        $worker->assignRole(UserRole::FieldWorker->value);

        $assignments = [
            (string) $checkpoints[0]->id => (string) $worker->id,
            (string) $checkpoints[1]->id => (string) $worker->id,
            (string) $checkpoints[2]->id => (string) $worker->id,
            (string) $checkpoints[3]->id => (string) $worker->id,
        ];

        $response = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/assign-all", [
            'assignments' => $assignments,
        ]);

        $response->assertRedirect("/sesi-pekerja/{$session->id}");

        foreach ($checkpoints as $cp) {
            $cp->refresh();
            $this->assertEquals($worker->id, $cp->pic_user_id);
        }
    }

    /** TEST 3: Super Admin can register Tongkang on Step 1 via web POST */
    public function test_super_admin_can_register_tongkang_on_step1(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-002');
        $step1 = $checkpoints[0];

        $response = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step1->id}/movements", [
            'movement_name' => 'Tongkang Bahari 01',
        ]);

        $response->assertRedirect("/sesi-pekerja/{$session->id}");
        $this->assertDatabaseHas('movements', [
            'session_checkpoint_id' => $step1->id,
            'movement_name'         => 'Tongkang Bahari 01',
        ]);
    }

    /** TEST 3: Registration on Step 2 is rejected */
    public function test_movement_registration_on_step2_is_rejected(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-003');
        $step2 = $checkpoints[1];

        $response = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step2->id}/movements", [
            'movement_name' => 'Tongkang Illegal Step2',
        ]);

        $response->assertSessionHasErrors('movement');
        $this->assertDatabaseMissing('movements', [
            'movement_name' => 'Tongkang Illegal Step2',
        ]);
    }

    /** TEST 4: Super Admin can save report data and uploaded photos for a movement */
    public function test_super_admin_can_save_movement_report_data_and_photos(): void
    {
        Storage::fake('public');
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-004');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Bahari 04'],
            $this->superAdmin->id
        );

        $fakePhoto = UploadedFile::fake()->image('lct_equip.jpg');

        $response = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step1->id}/movements/{$tongkang->id}/reports", [
            'fields' => [
                'nama_mv'       => 'MV Pacific Leader',
                'nama_tongkang' => 'Tongkang Bahari 04',
                'ciqp_status'   => 'CLEARED',
            ],
            'latitude'  => -1.265386,
            'longitude' => 116.831200,
            'photos'    => [
                'foto_equipment_lct' => $fakePhoto,
            ],
        ]);

        $response->assertRedirect("/sesi-pekerja/{$session->id}");

        $report = Report::where('session_checkpoint_id', $step1->id)->where('movement_id', $tongkang->id)->first();
        $this->assertNotNull($report);
        $this->assertEquals(-1.265386, (float) $report->latitude);
        $this->assertCount(3, $report->reportValues);
        $this->assertCount(1, $report->photos);
    }

    /** TEST 5: Complete report endpoint completes movement report and enables stage progression */
    public function test_complete_report_and_progress_stage_flow(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-005');
        $step1 = $checkpoints[0];
        $step2 = $checkpoints[1];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Bahari 05'],
            $this->superAdmin->id
        );

        // Populate complete Step 1 report
        $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            [
                'nama_mv'       => 'MV Oceanic Leader',
                'nama_tongkang' => 'Tongkang Bahari 05',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/e.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/c.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/l.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/b.jpg'],
            ],
            $this->superAdmin->id,
            -1.265386,
            116.831200
        );

        // Complete movement report via web POST
        $completeReportResponse = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step1->id}/movements/{$tongkang->id}/complete-report");
        $completeReportResponse->assertRedirect("/sesi-pekerja/{$session->id}");

        $report = Report::where('session_checkpoint_id', $step1->id)->where('movement_id', $tongkang->id)->first();
        $this->assertEquals(ReportStatus::COMPLETED, $report->status);

        // Pre-assign Step 2 PIC
        $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step2->id}/assign", [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        // Complete Step 1 Stage
        $completeStageResponse = $this->actingAs($this->superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$step1->id}/complete");
        $completeStageResponse->assertRedirect("/sesi-pekerja/{$session->id}");

        $step1->refresh();
        $step2->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step1->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $step2->status);

        // Step 2 now reuses the EXACT same Tongkang 05 movement!
        $step2Movements = $this->movementService->resolveMovementsForCheckpoint($session, $step2);
        $this->assertCount(1, $step2Movements);
        $this->assertEquals($tongkang->id, $step2Movements->first()->id);
    }

    /** TEST 6: Delete unstarted movement succeeds, deleting reported movement is rejected */
    public function test_delete_movement_validation_on_web(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-WEB-006');
        $step1 = $checkpoints[0];

        $tongkang1 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang To Delete'], $this->superAdmin->id);

        // Delete unstarted movement -> succeeds
        $delResponse = $this->actingAs($this->superAdmin)->delete("/sesi-pekerja/{$session->id}/movements/{$tongkang1->id}");
        $delResponse->assertRedirect("/sesi-pekerja/{$session->id}");
        $this->assertDatabaseMissing('movements', ['id' => $tongkang1->id]);

        // Create another movement and attach a report
        $tongkang2 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang With Report'], $this->superAdmin->id);
        $this->movementService->saveMovementReportData($session, $step1, $tongkang2, ['nama_mv' => 'MV Test'], [], $this->superAdmin->id);

        // Attempt delete -> rejected
        $delReportedResponse = $this->actingAs($this->superAdmin)->delete("/sesi-pekerja/{$session->id}/movements/{$tongkang2->id}");
        $delReportedResponse->assertSessionHasErrors('movement');
        $this->assertDatabaseHas('movements', ['id' => $tongkang2->id]);
    }
}
