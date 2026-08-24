<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
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
        $this->seed(\Database\Seeders\RoleSeeder::class);
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

    public function test_empty_state_when_no_active_field_workers_exist(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $response = $this->actingAs($superAdmin)->get('/sesi-pekerja/tambah');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('KelolaSesi/Create')
                ->has('fieldWorkers', 0)
            );
    }

    public function test_store_session_with_valid_field_worker_id(): void
    {
        $superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $fieldWorker = User::factory()->create(['status' => UserStatus::Active->value]);
        $fieldWorker->assignRole(UserRole::FieldWorker->value);

        $response = $this->actingAs($superAdmin)->post('/sesi-pekerja', [
            'id_sesi'         => 'SES-9999',
            'field_worker_id' => $fieldWorker->id,
            'unit_name'       => 'Excavator CAT 320',
            'initial_stage'   => 'Kapal',
            'notes'           => 'Test Catatan',
        ]);

        $response->assertRedirect('/sesi-pekerja');
    }
}
