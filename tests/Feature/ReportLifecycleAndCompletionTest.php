<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\MovementStatus;
use App\Enums\ReportStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\BusinessException;
use App\Models\Customer;
use App\Models\Movement;
use App\Models\Report;
use App\Models\ReportPhoto;
use App\Models\ReportTemplate;
use App\Models\ReportValue;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\TemplateField;
use App\Models\User;
use App\Services\MovementService;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportLifecycleAndCompletionTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private Customer $customer;
    private MovementService $movementService;
    private SessionCheckpointService $checkpointService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Mining Nusantara',
            'pic_name'     => 'Eko Mining',
            'email'        => 'eko@mining.com',
            'phone'        => '08123456788',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->movementService = app(MovementService::class);
        $this->checkpointService = app(SessionCheckpointService::class);
    }

    private function createTestSession(string $ref = 'SES-LC-001'): array
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => $ref,
            'cargo_name'     => 'Dump Trucks & Dozers',
            'total_quantity' => 4,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
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

    /** Helper: populate complete report data for Step 1 */
    private function populateCompleteStep1Report(ShippingSession $session, SessionCheckpoint $step1, Movement $tongkang): Report
    {
        return $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            [
                'nama_mv'       => 'MV Oceanic Pioneer',
                'nama_tongkang' => 'Tongkang Perkasa 01',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
            $this->superAdmin->id,
            -1.265386,
            116.831200
        );
    }

    /** TEST 1: Incomplete report (missing field) cannot be completed */
    public function test_incomplete_report_missing_field_cannot_be_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T1');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Beta 01'],
            $this->superAdmin->id
        );

        // Save report missing 'ciqp_status'
        $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            [
                'nama_mv'       => 'MV Oceanic',
                'nama_tongkang' => 'Tongkang Beta 01',
                // missing ciqp_status
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
            $this->superAdmin->id,
            -1.265386,
            116.831200
        );

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage("Field 'CIQP Status' wajib diisi");

        $this->movementService->completeMovementReport($session, $step1, $tongkang);
    }

    /** TEST 2: Incomplete report (missing photo slot) cannot be completed */
    public function test_incomplete_report_missing_photo_slot_cannot_be_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T2');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Beta 02'],
            $this->superAdmin->id
        );

        // Save report missing 'foto_barge_cast_off'
        $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            [
                'nama_mv'       => 'MV Oceanic',
                'nama_tongkang' => 'Tongkang Beta 02',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                // missing foto_barge_cast_off
            ],
            $this->superAdmin->id,
            -1.265386,
            116.831200
        );

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage("Foto 'Foto Barge Cast Off' wajib diunggah");

        $this->movementService->completeMovementReport($session, $step1, $tongkang);
    }

    /** TEST 3: Incomplete report (missing GPS) cannot be completed */
    public function test_incomplete_report_missing_gps_cannot_be_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T3');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Beta 03'],
            $this->superAdmin->id
        );

        // Save report with null coordinates
        $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            [
                'nama_mv'       => 'MV Oceanic',
                'nama_tongkang' => 'Tongkang Beta 03',
                'ciqp_status'   => 'CLEARED',
            ],
            [
                ['field_key' => 'foto_equipment_lct', 'photo_url' => 'https://s3/equip.jpg'],
                ['field_key' => 'foto_ciqp_approval', 'photo_url' => 'https://s3/ciqp.jpg'],
                ['field_key' => 'foto_lashing_tongkang', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_barge_cast_off', 'photo_url' => 'https://s3/castoff.jpg'],
            ],
            $this->superAdmin->id,
            null, // null latitude
            null  // null longitude
        );

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Koordinat GPS (latitude dan longitude) wajib dicatat');

        $this->movementService->completeMovementReport($session, $step1, $tongkang);
    }

    /** TEST 4: Complete report successfully transitions to COMPLETED */
    public function test_complete_report_successfully_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T4');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Beta 04'],
            $this->superAdmin->id
        );

        $this->populateCompleteStep1Report($session, $step1, $tongkang);

        $completedReport = $this->movementService->completeMovementReport($session, $step1, $tongkang);

        $this->assertEquals(ReportStatus::COMPLETED, $completedReport->status);

        $tongkang->refresh();
        $this->assertEquals(MovementStatus::COMPLETED, $tongkang->status);
    }

    /** TEST 5 & 6: Checkpoint cannot be completed if one movement is incomplete */
    public function test_checkpoint_cannot_be_completed_if_one_movement_is_incomplete(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T5');
        $step1 = $checkpoints[0];

        $tongkang1 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang 1'], $this->superAdmin->id);
        $tongkang2 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang 2'], $this->superAdmin->id);

        // Tongkang 1 is completed
        $this->populateCompleteStep1Report($session, $step1, $tongkang1);
        $this->movementService->completeMovementReport($session, $step1, $tongkang1);

        // Tongkang 2 is still IN_PROGRESS (not completed)
        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage("Armada 'Tongkang 2' belum menyelesaikan seluruh laporan/foto pada tahap ini");

        $this->checkpointService->completeCheckpoint($step1);
    }

    /** TEST 7: Checkpoint successfully completes when all registered movements are completed */
    public function test_checkpoint_completes_when_all_movements_are_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T7');
        $step1 = $checkpoints[0];
        $step2 = $checkpoints[1];

        $tongkang1 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang 1'], $this->superAdmin->id);
        $tongkang2 = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang 2'], $this->superAdmin->id);

        // Complete both Tongkang reports
        $this->populateCompleteStep1Report($session, $step1, $tongkang1);
        $this->movementService->completeMovementReport($session, $step1, $tongkang1);

        $this->populateCompleteStep1Report($session, $step1, $tongkang2);
        $this->movementService->completeMovementReport($session, $step1, $tongkang2);

        // Now Checkpoint 1 can complete -> auto activates Step 2
        $this->checkpointService->completeCheckpoint($step1);

        $step1->refresh();
        $step2->refresh();

        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step1->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $step2->status);
        $this->assertEquals($step2->checkpoint_id, $session->fresh()->current_checkpoint_id);
    }

    /** TEST 8: Database uniqueness constraint prevents duplicate reports for same checkpoint and movement */
    public function test_duplicate_report_on_same_movement_and_checkpoint_rejected_by_db_constraint(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T8');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang DB Unique'], $this->superAdmin->id);

        // Create first report
        Report::create([
            'session_checkpoint_id' => $step1->id,
            'movement_id'           => $tongkang->id,
            'report_template_id'    => $step1->template_snapshot['template_id'],
            'report_type'           => 'MOVEMENT',
            'created_by'            => $this->superAdmin->id,
        ]);

        // Attempt direct insertion of duplicate report for same (session_checkpoint_id, movement_id)
        $this->expectException(QueryException::class);

        Report::create([
            'session_checkpoint_id' => $step1->id,
            'movement_id'           => $tongkang->id,
            'report_template_id'    => $step1->template_snapshot['template_id'],
            'report_type'           => 'MOVEMENT',
            'created_by'            => $this->superAdmin->id,
        ]);
    }

    /** TEST 9: Template modification does not affect existing report validation requirement */
    public function test_template_modification_does_not_affect_existing_report_requirements(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T9');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang Immutability'], $this->superAdmin->id);
        $this->populateCompleteStep1Report($session, $step1, $tongkang);

        // Mutate master template by adding a brand new required field
        $masterTemplate = ReportTemplate::where('name', 'Laporan STS (Bongkar MV ke Tongkang)')->firstOrFail();
        TemplateField::create([
            'template_id' => $masterTemplate->id,
            'field_key'   => 'suhu_mesin',
            'field_name'  => 'suhu_mesin',
            'label'       => 'Suhu Mesin LCT',
            'field_type'  => 'number',
            'required'    => true,
            'sort_order'  => 88,
        ]);

        // Because session checkpoint uses immutable template_snapshot, the existing report can still complete without the newly added field!
        $completedReport = $this->movementService->completeMovementReport($session, $step1, $tongkang);
        $this->assertEquals(ReportStatus::COMPLETED, $completedReport->status);
    }

    /** TEST 10: Checkpoint with zero physical movements cannot be completed */
    public function test_checkpoint_with_zero_movements_cannot_be_completed(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T10');
        $step1 = $checkpoints[0];

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('Tidak bisa menyelesaikan tahap ini karena belum ada armada fisik yang terdaftar');

        $this->checkpointService->completeCheckpoint($step1);
    }

    /** TEST 11: End-to-end Step 1 -> Step 2 -> Step 3 -> Step 4 full session completion flow */
    public function test_end_to_end_step1_to_step4_full_session_completion_flow(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-LC-T11');
        $step1 = $checkpoints[0];
        $step2 = $checkpoints[1];
        $step3 = $checkpoints[2];
        $step4 = $checkpoints[3];

        // 1. STEP 1 (Kapal): Register Tongkang -> Complete Report -> Complete Step 1
        $tongkang = $this->movementService->createMovement($session, $step1, ['movement_name' => 'Tongkang E2E 01'], $this->superAdmin->id);
        $this->populateCompleteStep1Report($session, $step1, $tongkang);
        $this->movementService->completeMovementReport($session, $step1, $tongkang);

        // Assign PIC for Step 2 before completing Step 1
        $this->checkpointService->assignCheckpoint($step2, $this->superAdmin->id);
        $this->checkpointService->completeCheckpoint($step1);

        $step1->refresh();
        $step2->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step1->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $step2->status);

        // 2. STEP 2 (Tongkang): Reuses Tongkang E2E 01 -> Complete Report -> Complete Step 2
        $this->movementService->saveMovementReportData(
            $session,
            $step2,
            $tongkang,
            [
                'dermaga_pelindo' => 'Dermaga 02 Semayang',
                'waktu_sandar'    => '2026-09-02 10:00:00',
                'lokasi_storage'  => 'Lapangan Penumpukan A',
            ],
            [
                ['field_key' => 'foto_crane_sling_prep', 'photo_url' => 'https://s3/crane.jpg'],
                ['field_key' => 'foto_berthing_pelindo', 'photo_url' => 'https://s3/berthing.jpg'],
                ['field_key' => 'foto_discharge_port', 'photo_url' => 'https://s3/discharge.jpg'],
                ['field_key' => 'foto_cargo_temporary_storage', 'photo_url' => 'https://s3/storage.jpg'],
            ],
            $this->superAdmin->id,
            -1.265000,
            116.830000
        );
        $this->movementService->completeMovementReport($session, $step2, $tongkang);

        // Assign PIC for Step 3 before completing Step 2
        $this->checkpointService->assignCheckpoint($step3, $this->superAdmin->id);
        $this->checkpointService->completeCheckpoint($step2);

        $step2->refresh();
        $step3->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step2->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $step3->status);

        // 3. STEP 3 (Trucking): Register Truck (parent: Tongkang E2E 01) -> Complete Report -> Complete Step 3
        $truck = $this->movementService->createMovement(
            $session,
            $step3,
            ['movement_name' => 'Truk Hino KT 9999 XX', 'parent_movement_id' => $tongkang->id],
            $this->superAdmin->id
        );

        $this->movementService->saveMovementReportData(
            $session,
            $step3,
            $truck,
            [
                'license_plate'     => 'KT 9999 XX',
                'driver_name'       => 'Pak Suparman',
                'packing_list_item' => 'Dozer Komatsu D85',
            ],
            [
                ['field_key' => 'foto_truk_depan', 'photo_url' => 'https://s3/truk_depan.jpg'],
                ['field_key' => 'foto_truk_samping', 'photo_url' => 'https://s3/truk_samping.jpg'],
                ['field_key' => 'foto_sim_supir', 'photo_url' => 'https://s3/sim.jpg'],
                ['field_key' => 'foto_stnk_truk', 'photo_url' => 'https://s3/stnk.jpg'],
                ['field_key' => 'foto_lashing_truk', 'photo_url' => 'https://s3/lashing.jpg'],
                ['field_key' => 'foto_truk_berangkat', 'photo_url' => 'https://s3/berangkat.jpg'],
                ['field_key' => 'foto_surat_jalan', 'photo_url' => 'https://s3/sj.jpg'],
            ],
            $this->superAdmin->id,
            -1.264000,
            116.829000
        );
        $this->movementService->completeMovementReport($session, $step3, $truck);

        // Assign PIC for Step 4 before completing Step 3
        $this->checkpointService->assignCheckpoint($step4, $this->superAdmin->id);
        $this->checkpointService->completeCheckpoint($step3);

        $step3->refresh();
        $step4->refresh();
        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step3->status);
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $step4->status);

        // 4. STEP 4 (Site): Reuses Truck KT 9999 XX -> Complete Report with POD -> Complete Step 4 -> Session DELIVERED
        $this->movementService->saveMovementReportData(
            $session,
            $step4,
            $truck,
            [
                'nama_penerima_site' => 'Bpk. Ir. Rahmat Site Manager',
                'kondisi_barang'     => 'Diterima dalam kondisi prima dan tersegel',
            ],
            [
                ['field_key' => 'foto_surat_jalan_ttd_cap', 'photo_url' => 'https://s3/pod_signed_stamped.jpg'],
            ],
            $this->superAdmin->id,
            -0.900000,
            117.100000
        );
        $this->movementService->completeMovementReport($session, $step4, $truck);

        $this->checkpointService->completeCheckpoint($step4);

        $step4->refresh();
        $session->refresh();

        $this->assertEquals(SessionCheckpointStatus::COMPLETED, $step4->status);
        $this->assertEquals(ShippingSessionStatus::DELIVERED, $session->status);
    }
}
