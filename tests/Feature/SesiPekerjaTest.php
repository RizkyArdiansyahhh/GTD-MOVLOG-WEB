<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
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

        // Seed default 4 checkpoints if not exists
        if (Checkpoint::count() === 0) {
            Checkpoint::create(['name' => 'Kapal', 'sequence' => 1, 'description' => 'Tahap 1']);
            Checkpoint::create(['name' => 'Tongkang', 'sequence' => 2, 'description' => 'Tahap 2']);
            Checkpoint::create(['name' => 'Pelabuhan', 'sequence' => 3, 'description' => 'Tahap 3']);
            Checkpoint::create(['name' => 'Site', 'sequence' => 4, 'description' => 'Tahap 4']);
        }
    }

    public function test_super_admin_can_access_sesi_pekerja_index_page(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $response = $this->actingAs($superAdmin)->get('/sesi-pekerja');

        $response->assertStatus(200);
    }

    public function test_super_admin_can_access_sesi_pekerja_create_page(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $response = $this->actingAs($superAdmin)->get('/sesi-pekerja/tambah');

        $response->assertStatus(200);
    }

    public function test_dropdown_only_contains_active_field_workers(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        // Active field worker (should be in dropdown)
        $activeFieldWorker = User::factory()->create([
            'name'   => 'Ahmad Fauzan',
            'status' => UserStatus::Active->value,
        ]);
        $activeFieldWorker->assignRole(UserRole::FieldWorker->value);

        // Inactive field worker (should NOT be in dropdown)
        $inactiveFieldWorker = User::factory()->create([
            'name'   => 'Budi Nonaktif',
            'status' => UserStatus::Inactive->value,
        ]);
        $inactiveFieldWorker->assignRole(UserRole::FieldWorker->value);

        // Active staff worker (should NOT be in dropdown)
        $staffUser = User::factory()->create([
            'name'   => 'Cahyo Staff',
            'status' => UserStatus::Active->value,
        ]);
        $staffUser->assignRole(UserRole::Staff->value);

        $response = $this->actingAs($superAdmin)->get('/sesi-pekerja/tambah');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('KelolaSesi/Create')
                ->has('fieldWorkers', 1)
                ->where('fieldWorkers.0.id', (string) $activeFieldWorker->id)
                ->where('fieldWorkers.0.name', 'Ahmad Fauzan')
                ->where('fieldWorkers.0.status_label', 'Active')
            );
    }

    public function test_store_session_with_checkpoints_and_progress_lifecycle(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $worker1 = User::factory()->create(['name' => 'Worker 1', 'status' => UserStatus::Active->value]);
        $worker1->assignRole(UserRole::FieldWorker->value);

        $worker2 = User::factory()->create(['name' => 'Worker 2', 'status' => UserStatus::Active->value]);
        $worker2->assignRole(UserRole::FieldWorker->value);

        // 1. Store session
        $response = $this->actingAs($superAdmin)->post('/sesi-pekerja', [
            'id_sesi'           => 'SES-TEST-001',
            'units'             => [
                ['unit_name' => 'Excavator CAT 320', 'quantity' => 2],
            ],
            'kapal_pic_user_id' => $worker1->id,
            'notes'             => 'Test Catatan',
        ]);

        $response->assertRedirect('/sesi-pekerja');

        $session = ShippingSession::where('assignment_no', 'SES-TEST-001')->firstOrFail();
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
        $this->assertEquals($worker2->id, $cp2->pic_user_id);

        // 3. Complete Checkpoint 1 -> Checkpoint 2 auto-activates
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
