<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SessionAndCheckpointApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $workerA;
    private User $workerB;
    private Customer $customer;
    private ShippingSession $session;
    private SessionCheckpoint $checkpoint1;
    private SessionCheckpoint $checkpoint2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole('super-admin');

        $this->workerA = User::factory()->create(['name' => 'Worker A', 'status' => UserStatus::Active->value]);
        $this->workerA->assignRole('field-worker');

        $this->workerB = User::factory()->create(['name' => 'Worker B', 'status' => UserStatus::Active->value]);
        $this->workerB->assignRole('field-worker');

        $this->customer = Customer::create([
            'company_name' => 'PT Sumber Energi',
            'email'        => 'ptse@example.com',
        ]);

        $cpMaster1 = Checkpoint::create(['sequence' => 1, 'name' => 'Kapal']);
        $cpMaster2 = Checkpoint::create(['sequence' => 2, 'name' => 'Tongkang']);

        $this->session = ShippingSession::create([
            'customer_id'   => $this->customer->id,
            'created_by'    => $this->superAdmin->id,
            'assignment_no' => 'TRK-2026-001',
            'cargo_name'    => 'Excavator Komatsu PC200',
            'total_quantity'=> 1,
            'unit'          => 'Unit',
            'origin'        => 'Tanjung Perak',
            'destination'   => 'Balikpapan',
            'status'        => ShippingSessionStatus::IN_TRANSIT,
        ]);

        // Checkpoint 1 assigned to Worker A
        $this->checkpoint1 = SessionCheckpoint::create([
            'shipping_session_id' => $this->session->id,
            'checkpoint_id'       => $cpMaster1->id,
            'pic_user_id'         => $this->workerA->id,
            'status'              => SessionCheckpointStatus::IN_PROGRESS,
            'template_snapshot'   => ['template_name' => 'STS Kapal'],
        ]);

        // Checkpoint 2 assigned to Worker B
        $this->checkpoint2 = SessionCheckpoint::create([
            'shipping_session_id' => $this->session->id,
            'checkpoint_id'       => $cpMaster2->id,
            'pic_user_id'         => $this->workerB->id,
            'status'              => SessionCheckpointStatus::PENDING,
            'template_snapshot'   => ['template_name' => 'Tongkang Loading'],
        ]);
    }

    #[Test]
    public function unauthenticated_requests_return_json_401(): void
    {
        $this->getJson('/api/v1/sessions')
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);

        $this->getJson("/api/v1/sessions/{$this->session->id}")
            ->assertUnauthorized();

        $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->checkpoint1->id}")
            ->assertUnauthorized();
    }

    #[Test]
    public function super_admin_can_list_all_sessions(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/v1/sessions');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'assignment_no',
                        'cargo_name',
                        'status',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'total',
                ],
            ])
            ->assertJsonPath('meta.total', 1);
    }

    #[Test]
    public function field_worker_can_only_see_sessions_where_assigned_as_pic(): void
    {
        // Another session where neither Worker A nor B is assigned
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-002',
            'cargo_name'     => 'Bulldozer D85',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        Sanctum::actingAs($this->workerA);

        $response = $this->getJson('/api/v1/sessions');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($this->session->id, $response->json('data.0.id'));
    }

    #[Test]
    public function assigned_field_worker_can_view_session_detail(): void
    {
        Sanctum::actingAs($this->workerA);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data'    => [
                    'id'            => $this->session->id,
                    'assignment_no' => 'TRK-2026-001',
                    'cargo_name'    => 'Excavator Komatsu PC200',
                    'status'        => 'in_transit',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'checkpoints',
                ],
            ]);
    }

    #[Test]
    public function unassigned_field_worker_gets_403_on_session_detail(): void
    {
        $unassignedWorker = User::factory()->create(['status' => UserStatus::Active->value]);
        $unassignedWorker->assignRole('field-worker');

        Sanctum::actingAs($unassignedWorker);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}");

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
            ]);
    }

    #[Test]
    public function field_worker_can_view_their_assigned_checkpoint(): void
    {
        Sanctum::actingAs($this->workerA);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->checkpoint1->id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Checkpoint details retrieved successfully.',
                'data'    => [
                    'id'                  => $this->checkpoint1->id,
                    'shipping_session_id' => $this->session->id,
                    'sequence'            => 1,
                    'name'                => 'Kapal',
                    'status'              => 'in_progress',
                    'can_add_movement'    => true,
                    'movement_label'      => 'Tongkang / LCT',
                    'template_snapshot'   => [
                        'template_name' => 'STS Kapal',
                    ],
                ],
            ]);
    }

    #[Test]
    public function field_worker_cannot_view_checkpoint_assigned_to_another_worker(): void
    {
        // Worker A tries to view Checkpoint 2 (which is assigned to Worker B)
        Sanctum::actingAs($this->workerA);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->checkpoint2->id}");

        $response->assertForbidden()
            ->assertJson([
                'success' => false,
                'message' => 'Anda bukan petugas PIC yang ditugaskan pada tahap checkpoint ini.',
            ]);
    }

    #[Test]
    public function super_admin_can_view_any_checkpoint(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/{$this->checkpoint2->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $this->checkpoint2->id);
    }

    #[Test]
    public function nonexistent_session_returns_json_404(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/v1/sessions/nonexistent-session-id');

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Sesi pengiriman tidak ditemukan.',
            ]);
    }

    #[Test]
    public function nonexistent_checkpoint_returns_json_404(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}/checkpoints/nonexistent-checkpoint-id");

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Tahap checkpoint tidak ditemukan.',
            ]);
    }

    #[Test]
    public function checkpoint_belonging_to_another_session_returns_json_404(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OTHER-003',
            'cargo_name'     => 'Crane 100T',
            'total_quantity' => 1,
            'unit'           => 'Unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        Sanctum::actingAs($this->superAdmin);

        // Attempting to access checkpoint1 using otherSession ID
        $response = $this->getJson("/api/v1/sessions/{$otherSession->id}/checkpoints/{$this->checkpoint1->id}");

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Tahap checkpoint tidak ditemukan pada sesi pengiriman ini.',
            ]);
    }

    #[Test]
    public function completed_or_delivered_session_remains_readable(): void
    {
        $this->session->update(['status' => ShippingSessionStatus::DELIVERED]);

        Sanctum::actingAs($this->workerA);

        $response = $this->getJson("/api/v1/sessions/{$this->session->id}");

        $response->assertOk()
            ->assertJsonPath('data.status', 'delivered');
    }
}
