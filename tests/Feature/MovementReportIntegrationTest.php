<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\MovementType;
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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MovementReportIntegrationTest extends TestCase
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
            'company_name' => 'PT Semen Nusantara',
            'pic_name'     => 'Danang',
            'email'        => 'danang@semen.com',
            'phone'        => '08123456789',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->movementService = app(MovementService::class);
        $this->checkpointService = app(SessionCheckpointService::class);
    }

    private function createTestSession(string $ref = 'SES-REP-001'): array
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => $ref,
            'cargo_name'     => 'Cement Clinker',
            'total_quantity' => 500,
            'unit'           => 'ton',
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

    /** TEST 1: One Movement -> One Report Instance */
    public function test_one_movement_has_one_report_instance(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-REP-T1');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Perkasa 01'],
            $this->superAdmin->id
        );

        $report = $this->movementService->getOrCreateReportForMovement(
            $session,
            $step1,
            $tongkang,
            $this->superAdmin->id
        );

        $this->assertNotNull($report->id);
        $this->assertEquals($step1->id, $report->session_checkpoint_id);
        $this->assertEquals($tongkang->id, $report->movement_id);

        // Calling getOrCreateReportForMovement again returns the EXACT same report
        $reportSecondCall = $this->movementService->getOrCreateReportForMovement(
            $session,
            $step1,
            $tongkang,
            $this->superAdmin->id
        );
        $this->assertEquals($report->id, $reportSecondCall->id);
    }

    /** TEST 2 & 3 & 4: Two Truck Movements -> Two independent Report Instances with isolated data & photos */
    public function test_two_truck_movements_have_independent_reports_values_and_photos(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-REP-T2');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Induk'],
            $this->superAdmin->id
        );

        $truckA = $this->movementService->createMovement(
            $session,
            $step3,
            ['movement_name' => 'Truk A - B 1111 AAA', 'parent_movement_id' => $tongkang->id],
            $this->superAdmin->id
        );

        $truckB = $this->movementService->createMovement(
            $session,
            $step3,
            ['movement_name' => 'Truk B - B 2222 BBB', 'parent_movement_id' => $tongkang->id],
            $this->superAdmin->id
        );

        // Save data for Truck A
        $reportA = $this->movementService->saveMovementReportData(
            $session,
            $step3,
            $truckA,
            [
                'license_plate' => 'B 1111 AAA',
                'driver_name'   => 'Supir Ahmad',
            ],
            [
                [
                    'field_key'  => 'foto_truk_depan',
                    'photo_url'  => 'https://s3/truckA_front.jpg',
                    'caption'    => 'Foto Depan Truk A',
                ],
                [
                    'field_key'  => 'foto_sim_supir',
                    'photo_url'  => 'https://s3/sim_ahmad.jpg',
                    'caption'    => 'SIM Ahmad',
                ],
            ],
            $this->superAdmin->id,
            -6.200000,
            106.816666
        );

        // Save data for Truck B
        $reportB = $this->movementService->saveMovementReportData(
            $session,
            $step3,
            $truckB,
            [
                'license_plate' => 'B 2222 BBB',
                'driver_name'   => 'Supir Bambang',
            ],
            [
                [
                    'field_key'  => 'foto_truk_depan',
                    'photo_url'  => 'https://s3/truckB_front.jpg',
                    'caption'    => 'Foto Depan Truk B',
                ],
            ],
            $this->superAdmin->id,
            -6.210000,
            106.820000
        );

        // 1. Two independent report instances
        $this->assertNotEquals($reportA->id, $reportB->id);
        $this->assertEquals($truckA->id, $reportA->movement_id);
        $this->assertEquals($truckB->id, $reportB->movement_id);

        // 2. Values are strictly isolated
        $valuesA = $reportA->reportValues->pluck('value', 'templateField.field_key');
        $valuesB = $reportB->reportValues->pluck('value', 'templateField.field_key');

        $this->assertEquals('B 1111 AAA', $valuesA['license_plate']);
        $this->assertEquals('Supir Ahmad', $valuesA['driver_name']);

        $this->assertEquals('B 2222 BBB', $valuesB['license_plate']);
        $this->assertEquals('Supir Bambang', $valuesB['driver_name']);

        $this->assertNotEquals($valuesA['driver_name'], $valuesB['driver_name']);

        // 3. Photos are strictly isolated
        $photosA = $reportA->photos->pluck('photo_url')->toArray();
        $photosB = $reportB->photos->pluck('photo_url')->toArray();

        $this->assertCount(2, $photosA);
        $this->assertCount(1, $photosB);

        $this->assertContains('https://s3/truckA_front.jpg', $photosA);
        $this->assertNotContains('https://s3/truckA_front.jpg', $photosB);

        $this->assertContains('https://s3/truckB_front.jpg', $photosB);
        $this->assertNotContains('https://s3/truckB_front.jpg', $photosA);
    }

    /** TEST 5: Template change does not alter existing Report Instance */
    public function test_template_change_does_not_alter_existing_report_instance(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-REP-T5');
        $step1 = $checkpoints[0];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Abadi'],
            $this->superAdmin->id
        );

        $report = $this->movementService->saveMovementReportData(
            $session,
            $step1,
            $tongkang,
            ['nama_mv' => 'MV Oceanic Star'],
            [],
            $this->superAdmin->id
        );

        $this->assertEquals('MV Oceanic Star', $report->reportValues->first()->value);

        // Mutate master template by adding new field
        $masterTemplate = ReportTemplate::where('name', 'Laporan STS (Bongkar MV ke Tongkang)')->firstOrFail();
        TemplateField::create([
            'template_id' => $masterTemplate->id,
            'field_key'   => 'extra_field',
            'field_name'  => 'extra_field',
            'label'       => 'Extra Field',
            'field_type'  => 'text',
            'required'    => false,
            'sort_order'  => 99,
        ]);

        // Refresh existing report -> value remains intact
        $report->refresh();
        $this->assertEquals('MV Oceanic Star', $report->reportValues->first()->value);
    }

    /** TEST 6: Step 2 reuses Step 1 Movement for reporting */
    public function test_step2_reuses_step1_movement_for_reporting(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-REP-T6');
        $step1 = $checkpoints[0];
        $step2 = $checkpoints[1];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Samudera'],
            $this->superAdmin->id
        );

        // Report in Step 2 for this Tongkang
        $reportStep2 = $this->movementService->saveMovementReportData(
            $session,
            $step2,
            $tongkang,
            ['dermaga_pelindo' => 'Dermaga 03 Semayang'],
            [],
            $this->superAdmin->id
        );

        $this->assertEquals($step2->id, $reportStep2->session_checkpoint_id);
        $this->assertEquals($tongkang->id, $reportStep2->movement_id);
        $this->assertEquals('Dermaga 03 Semayang', $reportStep2->reportValues->first()->value);
    }

    /** TEST 7: Step 4 reuses Step 3 Movement for reporting (POD) */
    public function test_step4_reuses_step3_movement_for_reporting(): void
    {
        [$session, $checkpoints] = $this->createTestSession('SES-REP-T7');
        $step1 = $checkpoints[0];
        $step3 = $checkpoints[2];
        $step4 = $checkpoints[3];

        $tongkang = $this->movementService->createMovement(
            $session,
            $step1,
            ['movement_name' => 'Tongkang Induk'],
            $this->superAdmin->id
        );

        $truck = $this->movementService->createMovement(
            $session,
            $step3,
            ['movement_name' => 'Truk 01 - KT 8888 BB', 'parent_movement_id' => $tongkang->id],
            $this->superAdmin->id
        );

        // Step 4 POD report for this Truck
        $reportStep4 = $this->movementService->saveMovementReportData(
            $session,
            $step4,
            $truck,
            [
                'nama_penerima_site' => 'Pak Joko Mandor Site',
                'kondisi_barang'     => 'Lengkap dan baik',
            ],
            [
                [
                    'field_key' => 'foto_surat_jalan_ttd_cap',
                    'photo_url' => 'https://s3/pod_stamped.jpg',
                ],
            ],
            $this->superAdmin->id
        );

        $this->assertEquals($step4->id, $reportStep4->session_checkpoint_id);
        $this->assertEquals($truck->id, $reportStep4->movement_id);
        $this->assertCount(2, $reportStep4->reportValues);
        $this->assertCount(1, $reportStep4->photos);
    }

    /** TEST 8: Cross-session report reference is strictly rejected */
    public function test_cross_session_report_reference_rejected(): void
    {
        [$sessionA, $checkpointsA] = $this->createTestSession('SES-REP-8A');
        [$sessionB, $checkpointsB] = $this->createTestSession('SES-REP-8B');

        $tongkangA = $this->movementService->createMovement(
            $sessionA,
            $checkpointsA[0],
            ['movement_name' => 'Tongkang Session A'],
            $this->superAdmin->id
        );

        $this->expectException(BusinessException::class);
        $this->expectExceptionMessage('tidak valid atau bukan milik sesi pengiriman ini');

        $this->movementService->saveMovementReportData(
            $sessionB,
            $checkpointsB[0],
            $tongkangA, // Attempting to report on Tongkang A within Session B!
            ['nama_mv' => 'MV Illegal'],
            [],
            $this->superAdmin->id
        );
    }
}
