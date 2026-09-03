<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\ReportTemplate;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\TemplateField;
use App\Models\User;
use App\Services\SessionCheckpointService;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateSnapshotInitializationTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Petro Kalimantan',
            'pic_name'     => 'Budi Petro',
            'email'        => 'budi@petro.com',
            'phone'        => '08123456789',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);
    }

    public function test_session_creation_initializes_exactly_4_checkpoints_with_snapshots(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-SNAP-001',
            'cargo_name'     => 'Excavator CAT 320',
            'total_quantity' => 2,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($session, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $checkpoints = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->with('checkpoint')
            ->get()
            ->sortBy('checkpoint.sequence')
            ->values();

        // 1. Exactly 4 checkpoints created
        $this->assertCount(4, $checkpoints);

        // 2. Checkpoint 1 is IN_PROGRESS, others PENDING
        $this->assertEquals(SessionCheckpointStatus::IN_PROGRESS, $checkpoints[0]->status);
        $this->assertEquals(SessionCheckpointStatus::PENDING, $checkpoints[1]->status);
        $this->assertEquals(SessionCheckpointStatus::PENDING, $checkpoints[2]->status);
        $this->assertEquals(SessionCheckpointStatus::PENDING, $checkpoints[3]->status);

        // 3. Every checkpoint has a valid immutable template_snapshot
        foreach ($checkpoints as $sc) {
            $this->assertNotNull($sc->template_snapshot);
            $this->assertIsArray($sc->template_snapshot);
            $this->assertArrayHasKey('template_id', $sc->template_snapshot);
            $this->assertArrayHasKey('template_name', $sc->template_snapshot);
            $this->assertArrayHasKey('version', $sc->template_snapshot);
            $this->assertArrayHasKey('fields', $sc->template_snapshot);
            $this->assertArrayHasKey('photo_slots', $sc->template_snapshot);
        }

        // 4. Verify Step 1 (Kapal) snapshot contents
        $step1Snapshot = $checkpoints[0]->template_snapshot;
        $this->assertEquals('Laporan STS (Bongkar MV ke Tongkang)', $step1Snapshot['template_name']);
        $this->assertCount(3, $step1Snapshot['fields']); // nama_mv, nama_tongkang, ciqp_status
        $this->assertCount(4, $step1Snapshot['photo_slots']); // foto_equipment_lct, foto_ciqp_approval, foto_lashing_tongkang, foto_barge_cast_off

        // 5. Verify Step 3 (Trucking) snapshot contents
        $step3Snapshot = $checkpoints[2]->template_snapshot;
        $this->assertEquals('Laporan Trucking (Transport Darat)', $step3Snapshot['template_name']);
        $this->assertCount(3, $step3Snapshot['fields']); // license_plate, driver_name, packing_list_item
        $this->assertCount(7, $step3Snapshot['photo_slots']); // 7 photo slots
    }

    public function test_master_template_mutation_does_not_mutate_existing_session_snapshot(): void
    {
        // 1. Create Session A
        $sessionA = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-SNAP-A',
            'cargo_name'     => 'Cargo A',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($sessionA);

        $cpA = SessionCheckpoint::where('shipping_session_id', $sessionA->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('name', 'Kapal'))
            ->firstOrFail();

        $originalFieldCount = count($cpA->template_snapshot['fields']);
        $this->assertEquals(3, $originalFieldCount);

        // 2. Mutate master template by adding a new field
        $masterTemplate = ReportTemplate::where('name', 'Laporan STS (Bongkar MV ke Tongkang)')->firstOrFail();
        TemplateField::create([
            'template_id' => $masterTemplate->id,
            'field_key'   => 'catatan_cuaca',
            'field_name'  => 'catatan_cuaca',
            'label'       => 'Catatan Cuaca Laut',
            'field_type'  => 'text',
            'required'    => false,
            'sort_order'  => 99,
        ]);

        // 3. Verify Session A's snapshot remains unchanged (Immutable)
        $cpA->refresh();
        $this->assertCount(3, $cpA->template_snapshot['fields']);
        $fieldKeysA = collect($cpA->template_snapshot['fields'])->pluck('field_key')->toArray();
        $this->assertNotContains('catatan_cuaca', $fieldKeysA);

        // 4. Create Session B -> receives the updated master template
        $sessionB = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-SNAP-B',
            'cargo_name'     => 'Cargo B',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($sessionB);

        $cpB = SessionCheckpoint::where('shipping_session_id', $sessionB->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('name', 'Kapal'))
            ->firstOrFail();

        $this->assertCount(4, $cpB->template_snapshot['fields']);
        $fieldKeysB = collect($cpB->template_snapshot['fields'])->pluck('field_key')->toArray();
        $this->assertContains('catatan_cuaca', $fieldKeysB);
    }

    public function test_verifikasi_berkas_completion_triggers_consistent_checkpoint_and_snapshot_initialization(): void
    {
        $supervisor = User::factory()->create(['status' => UserStatus::Active->value]);
        $supervisor->assignRole(UserRole::Supervisor->value);

        $asgRef = 'ASG-AUTO-SNAP-001';

        $docTypes = [
            'Bill of Lading',
            'Commercial Invoice',
            'Packing List',
            'Certificate of Origin (COO)',
            'Insurance',
        ];

        $documents = [];
        foreach ($docTypes as $typeName) {
            $dt = DocumentType::firstOrCreate(['name' => $typeName]);
            $documents[] = Document::create([
                'assignment_no_ref' => $asgRef,
                'customer_id'       => $this->customer->id,
                'document_type_id'  => $dt->id,
                'document_data'     => [
                    'cargoDetail'     => [['descriptionOfGoods' => 'Turbine Generator']],
                    'totalQuantity'   => ['totalGoods' => 5, 'totalGoodsUnit' => 'unit'],
                    'transportDetail' => ['portOfLoading' => 'Surabaya', 'portOfDischarge' => 'Semayang'],
                ],
                'file_name'         => "doc_{$dt->id}.pdf",
                'file_path'         => "documents/{$asgRef}/doc_{$dt->id}.pdf",
                'status'            => DocumentStatus::PENDING->value,
                'uploaded_by'       => $this->superAdmin->id,
            ]);
        }

        // Verify the first 4 documents -> session NOT created yet
        for ($i = 0; $i < 4; $i++) {
            $this->actingAs($supervisor)->post("/verifikasi-berkas/{$documents[$i]->id}/verify", [
                'notes' => 'Verified ok',
            ]);
        }
        $this->assertDatabaseMissing('shipping_sessions', ['assignment_no' => $asgRef]);

        // Verify the 5th (last) document -> triggers maybeGenerateShippingSession()
        $this->actingAs($supervisor)->post("/verifikasi-berkas/{$documents[4]->id}/verify", [
            'notes' => 'Verified final doc',
        ]);

        // Assert ShippingSession exists
        $session = ShippingSession::where('assignment_no', $asgRef)->firstOrFail();
        $this->assertEquals('Turbine Generator', $session->cargo_name);

        // Assert exactly 4 checkpoints initialized with immutable template_snapshot
        $checkpoints = SessionCheckpoint::where('shipping_session_id', $session->id)->get();
        $this->assertCount(4, $checkpoints);

        foreach ($checkpoints as $sc) {
            $this->assertNotNull($sc->template_snapshot);
            $this->assertArrayHasKey('fields', $sc->template_snapshot);
            $this->assertArrayHasKey('photo_slots', $sc->template_snapshot);
        }
    }
}
