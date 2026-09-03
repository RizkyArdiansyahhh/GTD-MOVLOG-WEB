<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SesiPekerjaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.testing.ensure_pages_exist' => false]);
        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);
    }

    public function test_super_admin_can_access_sesi_pekerja_index_page(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $response = $this->actingAs($superAdmin)->get('/sesi-pekerja');

        $response->assertStatus(200);
    }

    public function test_session_checkpoints_and_progress_lifecycle(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $customer = Customer::create([
            'company_name' => 'PT Test Logistik',
            'pic_name'     => 'Budi',
            'email'        => 'budi@test.com',
            'phone'        => '0812345678',
        ]);

        $worker1 = User::factory()->create(['name' => 'Worker 1', 'status' => UserStatus::Active->value]);
        $worker1->assignRole(UserRole::FieldWorker->value);

        $worker2 = User::factory()->create(['name' => 'Worker 2', 'status' => UserStatus::Active->value]);
        $worker2->assignRole(UserRole::FieldWorker->value);

        // 1. Automatically generated session (as done via document verification)
        $session = ShippingSession::create([
            'customer_id'    => $customer->id,
            'created_by'     => $superAdmin->id,
            'assignment_no'  => 'SES-TEST-001',
            'cargo_name'     => 'Excavator CAT 320',
            'total_quantity' => 2,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $checkpointService = app(SessionCheckpointService::class);
        $checkpointService->createCheckpointsForSession($session, [
            'pic_user_id' => $worker1->id,
        ]);

        $this->assertEquals(4, $session->sessionCheckpoints()->count());
        $checkpoints = $session->sessionCheckpoints()->with('checkpoint')->get()->sortBy('checkpoint.sequence')->values();

        // Checkpoint 1 (Kapal) should be active
        $cp1 = $checkpoints[0];
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $cp1->status);
        $this->assertEquals($worker1->id, $cp1->pic_user_id);

        // Checkpoint 2 (Tongkang) should be pending
        $cp2 = $checkpoints[1];
        $this->assertEquals(SessionCheckpointStatus::PENDING, $cp2->status);

        // 2. Pre-assign Checkpoint 2 to worker2
        $assignResponse = $this->actingAs($superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$cp2->id}/assign", [
            'pic_user_id' => $worker2->id,
        ]);
        $assignResponse->assertRedirect("/sesi-pekerja/{$session->id}");
        $cp2->refresh();

        // 3. Register and complete movement for Step 1 before completing stage
        $movService = app(\App\Services\MovementService::class);
        $tongkang = $movService->createMovement($session, $cp1, ['movement_name' => 'Tongkang Sesi 01'], $superAdmin->id);
        $movService->saveMovementReportData(
            $session,
            $cp1,
            $tongkang,
            [
                'nama_mv'       => 'MV Test',
                'nama_tongkang' => 'Tongkang Sesi 01',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/e.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/c.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/l.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/b.jpg'],
            ],
            $superAdmin->id,
            -1.2,
            116.8
        );
        $movService->completeMovementReport($session, $cp1, $tongkang);

        // Complete Checkpoint 1 -> Checkpoint 2 auto-activates
        $completeResponse = $this->actingAs($superAdmin)->post("/sesi-pekerja/{$session->id}/stages/{$cp1->id}/complete");
        $completeResponse->assertRedirect("/sesi-pekerja/{$session->id}");

        $cp1->refresh();
        $cp2->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $cp1->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $cp2->status);

        // 4. View show page
        $showResponse = $this->actingAs($superAdmin)->get("/sesi-pekerja/{$session->id}");
        $showResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('KelolaSesi/Show')
                ->has('session.stages', 4)
                ->where('session.sessionId', 'SES-TEST-001')
            );
    }
}
