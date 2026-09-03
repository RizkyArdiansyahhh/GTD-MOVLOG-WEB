<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Http\Resources\CheckpointResource;
use App\Http\Resources\MovementResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\SessionResource;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class ApiFoundationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A. Validation: API validation failure returns HTTP 422 JSON envelope (NOT HTML).
     */
    public function test_api_validation_failure_returns_json_422_envelope(): void
    {
        // Calling POST /api/v1/auth/login without required email and password
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'success' => false,
                'message' => 'The given data was invalid.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => [
                    'email',
                    'password',
                ],
            ]);
    }

    /**
     * B. BusinessException: Thrown during an API request returns HTTP 422 with standard envelope
     * and error_code = BUSINESS_RULE_VIOLATION.
     */
    public function test_business_exception_in_api_returns_json_422_with_error_code(): void
    {
        $response = $this->postJson('/api/v1/test-foundation/business-exception');

        $response->assertStatus(422)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'success'    => false,
                'message'    => 'Operasi melanggar aturan bisnis domain.',
                'error_code' => 'BUSINESS_RULE_VIOLATION',
            ]);
    }

    /**
     * C. Authentication failure: Unauthenticated API request returns HTTP 401 JSON (NOT HTML redirect).
     */
    public function test_unauthenticated_api_request_returns_json_401(): void
    {
        // GET /api/v1/auth/me is protected by auth:sanctum
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * D. Authorization failure: Forbidden API request returns HTTP 403 JSON envelope.
     */
    public function test_forbidden_api_request_returns_json_403(): void
    {
        $response = $this->getJson('/api/v1/test-foundation/forbidden');

        $response->assertStatus(403)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * E. Response envelope: Successful API response follows { success, message, data }.
     */
    public function test_successful_api_response_follows_standard_envelope(): void
    {
        $response = $this->getJson('/api/v1/test-foundation/success-envelope');

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/json')
            ->assertJson([
                'success' => true,
                'message' => 'Foundation probe success.',
                'data'    => [
                    'status' => 'operational',
                ],
            ]);
    }

    /**
     * F. Resources: Verify foundational Eloquent API Resources serialize cleanly.
     */
    public function test_foundational_api_resources_transform_correctly(): void
    {
        $user = User::factory()->create(['name' => 'Budi Santoso']);
        $customer = Customer::create([
            'company_name' => 'PT Mining Perkasa',
            'email' => 'contact@mining.local',
        ]);
        $checkpoint = Checkpoint::create([
            'name' => 'Ship-to-Ship',
            'sequence' => 1,
            'description' => 'Tahap 1',
        ]);

        $session = ShippingSession::create([
            'customer_id'   => $customer->id,
            'created_by'    => $user->id,
            'assignment_no' => 'TRK-TEST-001',
            'cargo_name'    => 'Excavator 50T',
            'total_quantity'=> 1,
            'unit'          => 'Unit',
            'origin'        => 'Port A',
            'destination'   => 'Port B',
            'status'        => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $sessionCheckpoint = SessionCheckpoint::create([
            'shipping_session_id' => $session->id,
            'checkpoint_id'       => $checkpoint->id,
            'pic_user_id'         => $user->id,
            'status'              => SessionCheckpointStatus::IN_PROGRESS,
            'template_snapshot'   => ['template_name' => 'Standard STS'],
        ]);

        $movement = Movement::create([
            'session_checkpoint_id' => $sessionCheckpoint->id,
            'movement_name'         => 'TB Berkah 01',
            'movement_type'         => MovementType::LOADING,
            'sequence'              => 1,
            'status'                => MovementStatus::IN_PROGRESS,
            'created_by'            => $user->id,
        ]);

        $template = \App\Models\ReportTemplate::create([
            'checkpoint_id'          => $checkpoint->id,
            'name'                   => 'Standard STS',
            'applies_to_report_type' => \App\Enums\ReportType::Movement->value,
            'created_by'             => $user->id,
        ]);

        $report = Report::create([
            'session_checkpoint_id' => $sessionCheckpoint->id,
            'movement_id'           => $movement->id,
            'report_template_id'    => $template->id,
            'report_type'           => \App\Enums\ReportType::Movement,
            'status'                => ReportStatus::IN_PROGRESS,
            'event_at'              => now(),
            'latitude'              => -0.501,
            'longitude'             => 117.150,
            'created_by'            => $user->id,
        ]);

        $request = Request::create('/api/v1/test');

        // 1. SessionResource
        $sessionArray = (new SessionResource($session))->toArray($request);
        $this->assertEquals('TRK-TEST-001', $sessionArray['assignment_no']);
        $this->assertEquals('in_transit', $sessionArray['status']);

        // 2. CheckpointResource
        $sessionCheckpoint->load('checkpoint');
        $checkpointArray = (new CheckpointResource($sessionCheckpoint))->toArray($request);
        $this->assertEquals(1, $checkpointArray['sequence']);
        $this->assertTrue($checkpointArray['can_add_movement']);
        $this->assertEquals('Tongkang / LCT', $checkpointArray['movement_label']);
        $this->assertEquals(['template_name' => 'Standard STS'], $checkpointArray['template_snapshot']);

        // 3. MovementResource
        $movementArray = (new MovementResource($movement))->toArray($request);
        $this->assertEquals('TB Berkah 01', $movementArray['movement_name']);
        $this->assertEquals('loading', $movementArray['movement_type']);

        // 4. ReportResource
        $reportArray = (new ReportResource($report))->toArray($request);
        $this->assertEquals('in_progress', $reportArray['status']);
        $this->assertEquals(-0.501, $reportArray['latitude']);
    }
}
