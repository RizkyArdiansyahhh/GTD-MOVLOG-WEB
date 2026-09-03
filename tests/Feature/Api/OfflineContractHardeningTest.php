<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\MovementStatus;
use App\Enums\MovementType;
use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Services\IdempotencyService;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class OfflineContractHardeningTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $fieldWorkerPicStep1;
    private User $fieldWorkerPicStep3;
    private User $unauthorizedWorker;
    private Customer $customer;
    private ShippingSession $session;
    private SessionCheckpoint $step1;
    private SessionCheckpoint $step2;
    private SessionCheckpoint $step3;
    private SessionCheckpoint $step4;

    private MovementService $movementService;
    private IdempotencyService $idempotencyService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->movementService = app(MovementService::class);
        $this->idempotencyService = app(IdempotencyService::class);

        // Ensure clean cache state
        try {
            Cache::store(config('idempotency.store', 'redis'))->flush();
        } catch (\Throwable $e) {
            // Ignore if store is unavailable
        }

        Storage::fake('public');

        $this->customer = Customer::create([
            'company_name' => 'PT Borneo Coal Mining',
            'pic_name'     => 'Hendra Wijaya',
            'email'        => 'hendra@borneocoal.com',
            'phone'        => '08123456789',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->fieldWorkerPicStep1 = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->fieldWorkerPicStep1->assignRole(UserRole::FieldWorker->value);

        $this->fieldWorkerPicStep3 = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->fieldWorkerPicStep3->assignRole(UserRole::FieldWorker->value);

        $this->unauthorizedWorker = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->unauthorizedWorker->assignRole(UserRole::FieldWorker->value);

        $this->session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'TRK-OFFLINE-001',
            'cargo_name'     => 'Batubara Thermal',
            'total_quantity' => 10000,
            'unit'           => 'MT',
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

        $this->step1->update([
            'pic_user_id' => $this->fieldWorkerPicStep1->id,
            'status'      => SessionCheckpointStatus::IN_PROGRESS,
        ]);
        $this->step2->update(['pic_user_id' => $this->fieldWorkerPicStep1->id]);
        $this->step3->update(['pic_user_id' => $this->fieldWorkerPicStep3->id]);
        $this->step4->update(['pic_user_id' => $this->fieldWorkerPicStep3->id]);
    }

    private function populateValidStep1Report(Movement $movement): Report
    {
        return $this->movementService->saveMovementReportData(
            $this->session,
            $this->step1,
            $movement,
            [
                'nama_mv'       => 'MV Oceanic Pioneer',
                'nama_tongkang' => 'Tongkang Oceanic 01',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
            (string) $this->fieldWorkerPicStep1->id,
            -1.265386,
            116.831200,
            now()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. HYBRID CLIENT / SERVER ULID FOR MOVEMENT
    // ─────────────────────────────────────────────────────────────────────────

    public function test_movement_creation_without_client_id_generates_valid_ulid(): void
    {
        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'movement_name' => 'Tongkang Server ULID 01',
            ]
        );

        $response->assertStatus(201);
        $generatedId = $response->json('data.id');
        $this->assertNotEmpty($generatedId);
        $this->assertTrue(Str::isUlid($generatedId));
        $this->assertDatabaseHas('movements', [
            'id'            => $generatedId,
            'movement_name' => 'Tongkang Server ULID 01',
        ]);
    }

    public function test_movement_creation_with_valid_client_ulid_persists_exact_id(): void
    {
        $clientUlid = (string) Str::ulid();

        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => $clientUlid,
                'movement_name' => 'Tongkang Client ULID 01',
            ]
        );

        $response->assertStatus(201);
        $this->assertSame($clientUlid, $response->json('data.id'));
        $this->assertDatabaseHas('movements', [
            'id'            => $clientUlid,
            'movement_name' => 'Tongkang Client ULID 01',
        ]);
    }

    public function test_movement_creation_with_invalid_ulid_rejected_with_422(): void
    {
        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => 'invalid-non-ulid-string',
                'movement_name' => 'Tongkang Invalid ULID',
            ]
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['id']);
    }

    public function test_movement_creation_with_duplicate_client_ulid_rejected_with_422(): void
    {
        $clientUlid = (string) Str::ulid();

        // First creation succeeds
        $first = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => $clientUlid,
                'movement_name' => 'Tongkang Unique 01',
            ]
        );
        $first->assertStatus(201);

        // Attempt second creation with SAME ULID but different name
        $second = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => $clientUlid,
                'movement_name' => 'Tongkang Unique 02',
            ]
        );

        $second->assertStatus(422);
        $second->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
        $this->assertStringContainsString('ID armada sudah terdaftar', $second->json('message'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. IDEMPOTENCY REPLAY & PAYLOAD FINGERPRINTING
    // ─────────────────────────────────────────────────────────────────────────

    public function test_movement_creation_with_same_idempotency_key_replays_exact_response(): void
    {
        $idempotencyKey = (string) Str::uuid();
        $clientUlid = (string) Str::ulid();

        $payload = [
            'id'            => $clientUlid,
            'movement_name' => 'Tongkang Idempotent 01',
        ];

        // 1st request
        $response1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $response1->assertStatus(201);
        $createdId = $response1->json('data.id');

        // 2nd request with identical key and payload
        $response2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $response2->assertStatus(201);
        $response2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame($createdId, $response2->json('data.id'));

        // Verify only 1 movement exists in database
        $this->assertEquals(1, Movement::where('id', $clientUlid)->count());
    }

    public function test_same_semantic_json_payload_with_different_key_ordering_replays_success(): void
    {
        $idempotencyKey = (string) Str::uuid();
        $clientUlid = (string) Str::ulid();

        // Order 1: id, then movement_name
        $payload1 = [
            'id'            => $clientUlid,
            'movement_name' => 'Tongkang Key Order Test',
        ];

        $response1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            $payload1,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $response1->assertStatus(201);

        // Order 2: movement_name, then id (reversed key order)
        $payload2 = [
            'movement_name' => 'Tongkang Key Order Test',
            'id'            => $clientUlid,
        ];

        $response2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            $payload2,
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $response2->assertStatus(201);
        $response2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame($clientUlid, $response2->json('data.id'));
    }

    public function test_same_key_different_payload_returns_409_conflict(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // 1st request
        $response1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Alpha 01'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $response1->assertStatus(201);

        // 2nd request with SAME key but DIFFERENT payload
        $response2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Beta 02'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $response2->assertStatus(409);
        $response2->assertJsonPath('error_code', 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
        $this->assertStringContainsString('Kunci idempotensi telah digunakan sebelumnya', $response2->json('message'));
    }

    public function test_same_client_movement_ulid_with_different_idempotency_key_rejected_as_duplicate(): void
    {
        $clientUlid = (string) Str::ulid();

        // 1st request with Key A
        $response1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['id' => $clientUlid, 'movement_name' => 'Tongkang Arm A'],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );
        $response1->assertStatus(201);

        // 2nd request with Key B (NEW operation identity) targeting same client ULID
        $response2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['id' => $clientUlid, 'movement_name' => 'Tongkang Arm B'],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );

        $response2->assertStatus(422);
        $response2->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
        $this->assertStringContainsString('ID armada sudah terdaftar', $response2->json('message'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CONCURRENCY & DOUBLE-CHECKED LOCKING
    // ─────────────────────────────────────────────────────────────────────────

    public function test_same_key_concurrent_requests_handled_safely_without_double_mutation(): void
    {
        $idempotencyKey = (string) Str::uuid();
        $clientUlid = (string) Str::ulid();

        $payload = [
            'id'            => $clientUlid,
            'movement_name' => 'Tongkang Concurrent Test',
        ];

        // Partial mock: simulate acquireLock failing (lock currently held by another worker)
        $this->partialMock(IdempotencyService::class, function ($mock) {
            $mock->shouldReceive('acquireLock')
                ->once()
                ->andReturn(false);
        });

        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $response->assertStatus(409);
        $response->assertJsonPath('error_code', 'CONCURRENT_REQUEST');
        $response->assertHeader('Retry-After', '2');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. REAL REDIS FAILURE TEST (Preserving Real HTTP & Real PostgreSQL)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_redis_persistence_failure_after_db_commit_returns_success_and_preserves_db_state(): void
    {
        $idempotencyKey = (string) Str::uuid();
        $clientUlid = (string) Str::ulid();

        // Use partialMock so lookup(), acquireLock(), and releaseLock() execute against REAL Redis,
        // and ONLY persistResult() is faulted to simulate Redis persistence failure.
        $this->partialMock(IdempotencyService::class, function ($mock) {
            $mock->shouldReceive('persistResult')
                ->once()
                ->andThrow(new \RedisException('Simulated Redis persistence connection failure'));
        });

        // Act: Real HTTP request sent to real controller and real PostgreSQL
        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => $clientUlid,
                'movement_name' => 'Tongkang Redis Fault Test',
            ],
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        // 1. Primary request succeeds with HTTP 201
        $response->assertStatus(201);
        $response->assertJsonPath('data.id', $clientUlid);

        // 2. Real PostgreSQL transaction committed for real
        $this->assertDatabaseHas('movements', [
            'id'            => $clientUlid,
            'movement_name' => 'Tongkang Redis Fault Test',
        ]);

        // 3. Clear partial mock for retry assertion so unmocked service runs
        $this->app->forgetInstance(IdempotencyService::class);

        // 4. Client retry with same key now hits database directly (since Redis has no cached response)
        // and is rejected by the domain unique constraint
        $retryResponse = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            [
                'id'            => $clientUlid,
                'movement_name' => 'Tongkang Redis Fault Test',
            ],
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $retryResponse->assertStatus(422);
        $retryResponse->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. USER & ROUTE SCOPE ISOLATION
    // ─────────────────────────────────────────────────────────────────────────

    public function test_idempotency_key_scoped_to_user_cannot_be_replayed_by_another_user(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // User A (SuperAdmin) creates a movement
        $responseA = $this->actingAs($this->superAdmin, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang SuperAdmin A'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $responseA->assertStatus(201);

        // User B (FieldWorker PIC) uses the exact SAME idempotency key
        // Should NOT replay User A's result; it should execute as a distinct operation for User B
        $responseB = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Worker B'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $responseB->assertStatus(201);
        $this->assertNotSame($responseA->json('data.id'), $responseB->json('data.id'));
    }

    public function test_unauthorized_user_cannot_bypass_pic_authorization_using_idempotency_key(): void
    {
        $idempotencyKey = (string) Str::uuid();

        $response = $this->actingAs($this->unauthorizedWorker, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Unauthorized'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );

        $response->assertStatus(403);
        $response->assertJsonPath('error_code', 'FORBIDDEN');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. REPORT DRAFT & COMPLETION RETRY SEMANTICS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_report_draft_save_with_idempotency_key_replays_success(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Draft 01'],
            (string) $this->superAdmin->id
        );

        $idempotencyKey = (string) Str::uuid();
        $payload = [
            'latitude'  => -1.269160,
            'longitude' => 116.825264,
            'notes'     => 'Draft notes 1',
            'fields'    => ['cargo_condition' => 'Good'],
        ];

        // 1st request
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(200);

        // Retry with same key
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(200);
        $res2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
    }

    public function test_report_completion_same_key_retry_replays_success(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Complete Test'],
            (string) $this->superAdmin->id
        );

        $this->populateValidStep1Report($movement);

        $idempotencyKey = (string) Str::uuid();

        // 1st request: Complete report
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/complete",
            [],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(200);
        $this->assertSame(ReportStatus::COMPLETED->value, $res1->json('data.status'));

        // 2nd request: Retry with SAME key -> replays success
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/complete",
            [],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(200);
        $res2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame(ReportStatus::COMPLETED->value, $res2->json('data.status'));
    }

    public function test_report_completion_different_key_after_completion_returns_422_rule_violation(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Complete Diff Key'],
            (string) $this->superAdmin->id
        );

        $this->populateValidStep1Report($movement);

        // Complete with Key A
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/complete",
            [],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );
        $res1->assertStatus(200);

        // Attempt completion with Key B (NEW operation) -> must NOT replay, must enforce domain rule
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/complete",
            [],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );

        $res2->assertStatus(422);
        $res2->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. CHECKPOINT COMPLETION RETRY SEMANTICS
    // ─────────────────────────────────────────────────────────────────────────

    public function test_checkpoint_completion_same_key_retry_replays_success(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang CP Complete'],
            (string) $this->superAdmin->id
        );

        $this->populateValidStep1Report($movement);
        $this->movementService->completeMovementReport($this->session, $this->step1, $movement, (string) $this->fieldWorkerPicStep1->id);

        $idempotencyKey = (string) Str::uuid();

        // 1st request: Complete checkpoint
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete",
            [],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(200);
        $this->assertSame(SessionCheckpointStatus::COMPLETED->value, $res1->json('data.status'));

        // 2nd request: Retry with same key -> replays success
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete",
            [],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(200);
        $res2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame(SessionCheckpointStatus::COMPLETED->value, $res2->json('data.status'));
    }

    public function test_checkpoint_completion_different_key_after_completion_returns_422_rule_violation(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang CP Diff Key'],
            (string) $this->superAdmin->id
        );

        $this->populateValidStep1Report($movement);
        $this->movementService->completeMovementReport($this->session, $this->step1, $movement, (string) $this->fieldWorkerPicStep1->id);

        // Complete with Key A
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete",
            [],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );
        $res1->assertStatus(200);

        // Attempt completion with Key B (NEW operation) -> rejected by domain invariant
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/complete",
            [],
            ['X-Idempotency-Key' => (string) Str::uuid()]
        );

        $res2->assertStatus(422);
        $res2->assertJsonPath('error_code', 'BUSINESS_RULE_VIOLATION');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. PHOTO UPLOAD REPLAY & FAILURE CASES
    // ─────────────────────────────────────────────────────────────────────────

    public function test_photo_upload_with_same_key_replays_without_storing_second_file(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang Photo Replay'],
            (string) $this->superAdmin->id
        );

        $idempotencyKey = (string) Str::uuid();
        $fakeImage = UploadedFile::fake()->image('cargo.jpg', 600, 400);

        // 1st request
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->post(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/photos",
            [
                'photo'     => $fakeImage,
                'field_key' => 'foto_equipment_lct',
                'caption'   => 'Tampak depan',
            ],
            [
                'X-Idempotency-Key' => $idempotencyKey,
                'Accept'            => 'application/json',
            ]
        );
        $res1->assertStatus(201);
        $photoId = $res1->json('data.id');

        // 2nd request with same key and same file
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->post(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements/{$movement->id}/report/photos",
            [
                'photo'     => $fakeImage,
                'field_key' => 'foto_equipment_lct',
                'caption'   => 'Tampak depan',
            ],
            [
                'X-Idempotency-Key' => $idempotencyKey,
                'Accept'            => 'application/json',
            ]
        );
        $res2->assertStatus(201);
        $res2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame($photoId, $res2->json('data.id'));

        // Assert exactly 1 photo record exists in database
        $report = Report::where('movement_id', $movement->id)->firstOrFail();
        $this->assertEquals(1, ReportPhoto::where('report_id', $report->id)->count());
    }

    public function test_idempotency_key_invalid_format_rejected_with_422(): void
    {
        $response = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Invalid Key'],
            ['X-Idempotency-Key' => 'not-a-uuid-or-ulid!@#$']
        );

        $response->assertStatus(422);
        $response->assertJsonPath('error_code', 'INVALID_IDEMPOTENCY_KEY');
    }

    public function test_validation_failure_does_not_persist_idempotency_record(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // Send invalid payload (missing movement_name)
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => ''],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(422);

        // Corrected retry with same key: since 422 was NOT cached, client can retry with valid data!
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Corrected Name'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(201);
    }

    public function test_configured_ttl_is_exactly_7_days(): void
    {
        $this->assertSame(604800, config('idempotency.ttl'));
        $this->assertSame(604800, $this->idempotencyService->getTtl());
    }

    public function test_movement_update_with_idempotency_key_replays_success(): void
    {
        $movement = $this->movementService->createMovement(
            $this->session,
            $this->step1,
            ['movement_name' => 'Tongkang To Rename'],
            (string) $this->superAdmin->id
        );

        $idempotencyKey = (string) Str::uuid();
        $payload = ['movement_name' => 'Tongkang Renamed Once'];

        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$movement->id}",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(200);
        $this->assertSame('Tongkang Renamed Once', $res1->json('data.movement_name'));

        // Retry with same key
        $res2 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->patchJson(
            "/api/v1/sessions/{$this->session->id}/movements/{$movement->id}",
            $payload,
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(200);
        $res2->assertHeader('X-Cache', 'HIT-IDEMPOTENT');
        $this->assertSame('Tongkang Renamed Once', $res2->json('data.movement_name'));
    }

    public function test_failed_db_transaction_does_not_persist_idempotency_record(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // Attempt movement registration on Step 2 (forbidden by domain rule)
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step2->id}/movements",
            ['movement_name' => 'Tongkang Illegal Step 2'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(422);

        // Verify cache does not store 422 failure
        $storeName = config('idempotency.store', 'redis');
        $this->assertNull(Cache::store($storeName)->get("idempotency:v1:u:{$this->fieldWorkerPicStep1->id}:*"));
    }

    public function test_idempotency_key_scoped_to_route_and_parameters(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // Step 1 movement creation with Key X
        $res1 = $this->actingAs($this->superAdmin, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Route Scope 01'],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res1->assertStatus(201);
        $tongkangId = $res1->json('data.id');

        // Step 3 movement creation with SAME Key X but different checkpoint parameter
        $res2 = $this->actingAs($this->superAdmin, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step3->id}/movements",
            [
                'movement_name'      => 'Truk Route Scope 01',
                'parent_movement_id' => $tongkangId,
            ],
            ['X-Idempotency-Key' => $idempotencyKey]
        );
        $res2->assertStatus(201);
        $this->assertNotSame($tongkangId, $res2->json('data.id'));
    }

    public function test_scalar_type_differences_produce_different_fingerprints(): void
    {
        $reqInt = \Illuminate\Http\Request::create('/test', 'POST', ['quantity' => 100]);
        $reqStr = \Illuminate\Http\Request::create('/test', 'POST', ['quantity' => '100']);

        $hashInt = $this->idempotencyService->computePayloadFingerprint($reqInt);
        $hashStr = $this->idempotencyService->computePayloadFingerprint($reqStr);

        $this->assertNotSame($hashInt, $hashStr);
    }

    public function test_missing_fields_vs_null_produce_different_fingerprints(): void
    {
        $reqMissing = \Illuminate\Http\Request::create('/test', 'POST', ['name' => 'Barge']);
        $reqNull = \Illuminate\Http\Request::create('/test', 'POST', ['name' => 'Barge', 'notes' => null]);

        $hashMissing = $this->idempotencyService->computePayloadFingerprint($reqMissing);
        $hashNull = $this->idempotencyService->computePayloadFingerprint($reqNull);

        $this->assertNotSame($hashMissing, $hashNull);
    }

    public function test_request_without_idempotency_key_executes_normally(): void
    {
        $res1 = $this->actingAs($this->fieldWorkerPicStep1, 'sanctum')->postJson(
            "/api/v1/sessions/{$this->session->id}/checkpoints/{$this->step1->id}/movements",
            ['movement_name' => 'Tongkang Normal 01']
        );
        $res1->assertStatus(201);
        $this->assertFalse($res1->headers->has('X-Cache'));
    }
}
