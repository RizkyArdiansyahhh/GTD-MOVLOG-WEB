<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ReportType;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Report;
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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportTemplateManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $staffUser;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(CheckpointSeeder::class);
        $this->seed(ReportTemplateSeeder::class);

        $this->customer = Customer::create([
            'company_name' => 'PT Test Logistik Kalimantan',
            'pic_name'     => 'Budi Logistik',
            'email'        => 'budi@logistik.com',
            'phone'        => '081299998888',
        ]);

        $this->superAdmin = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->superAdmin->assignRole(UserRole::SuperAdmin->value);

        $this->staffUser = User::factory()->create(['status' => UserStatus::Active->value]);
        $this->staffUser->assignRole(UserRole::Staff->value);
    }

    /** TEST 1: Super Admin can view report templates index page */
    public function test_super_admin_can_view_report_templates_index(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/template-laporan');

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('TemplateLaporan/Index')
                ->has('templates')
                ->has('checkpoints')
            );
    }

    /** TEST 2: Super Admin can create a new master report template */
    public function test_super_admin_can_create_new_report_template_with_fields_and_photos(): void
    {
        $checkpoint = Checkpoint::where('sequence', 1)->firstOrFail();

        $payload = [
            'checkpoint_id'          => $checkpoint->id,
            'name'                   => 'Custom STS Heavy Cargo Template',
            'description'            => 'Prosedur kargo berat di Kapal',
            'applies_to_report_type' => ReportType::Movement->value,
            'fields'                 => [
                [
                    'field_name'  => 'Berat Aktual Kargo',
                    'field_key'   => 'berat_aktual_kargo',
                    'label'       => 'Berat Aktual Kargo (Ton)',
                    'field_type'  => 'number',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 1,
                ],
                [
                    'field_name'  => 'Status Crane',
                    'field_key'   => 'status_crane',
                    'label'       => 'Status Crane',
                    'field_type'  => 'dropdown',
                    'required'    => true,
                    'options'     => ['OK', 'MAINTENANCE'],
                    'sort_order'  => 2,
                ],
                [
                    'field_name'  => 'Foto Lifting Kargo',
                    'field_key'   => 'foto_lifting_kargo',
                    'label'       => 'Foto Lifting Kargo',
                    'field_type'  => 'photo',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 3,
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)->post('/template-laporan', $payload);

        $response->assertRedirect('/template-laporan');

        $this->assertDatabaseHas('report_templates', [
            'name'          => 'Custom STS Heavy Cargo Template',
            'checkpoint_id' => $checkpoint->id,
        ]);

        $createdTemplate = ReportTemplate::where('name', 'Custom STS Heavy Cargo Template')->firstOrFail();
        $this->assertCount(3, $createdTemplate->templateFields);
        $this->assertEquals(2, $createdTemplate->templateFields()->where('field_type', '!=', 'photo')->count());
        $this->assertEquals(1, $createdTemplate->templateFields()->where('field_type', 'photo')->count());
    }

    /** TEST 3: Super Admin can update an existing master report template */
    public function test_super_admin_can_update_existing_report_template(): void
    {
        $template = ReportTemplate::firstOrFail();

        $payload = [
            'checkpoint_id'          => $template->checkpoint_id,
            'name'                   => 'Updated Template Name ' . uniqid(),
            'description'            => 'Updated description notes',
            'applies_to_report_type' => ReportType::Movement->value,
            'fields'                 => [
                [
                    'field_name'  => 'Catatan Tambahan',
                    'field_key'   => 'catatan_tambahan',
                    'label'       => 'Catatan Tambahan',
                    'field_type'  => 'text',
                    'required'    => false,
                    'options'     => null,
                    'sort_order'  => 1,
                ],
                [
                    'field_name'  => 'Foto Kondisi Akhir',
                    'field_key'   => 'foto_kondisi_akhir',
                    'label'       => 'Foto Kondisi Akhir',
                    'field_type'  => 'photo',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 2,
                ],
            ],
        ];

        $response = $this->actingAs($this->superAdmin)->put("/template-laporan/{$template->id}", $payload);

        $response->assertRedirect('/template-laporan');

        $template->refresh();
        $this->assertEquals($payload['name'], $template->name);
        $this->assertEquals('Updated description notes', $template->description);
        $this->assertCount(2, $template->templateFields);
    }

    /** TEST 4: Updating master template does NOT alter existing session checkpoint snapshot (Immutability) */
    public function test_updating_master_template_does_not_alter_existing_session_checkpoint_snapshot(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-SNAP-IMMUTABLE',
            'cargo_name'     => 'Excavator 100T',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($session, [
            'pic_user_id' => $this->superAdmin->id,
        ]);

        $step1Checkpoint = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->firstOrFail();

        $originalSnapshot = $step1Checkpoint->template_snapshot;
        $this->assertNotNull($originalSnapshot);
        $originalFieldsCount = count($originalSnapshot['fields']);
        $originalPhotoCount = count($originalSnapshot['photo_slots']);

        // Now Super Admin updates the master template in database
        $masterTemplate = ReportTemplate::findOrFail($originalSnapshot['template_id']);

        $this->actingAs($this->superAdmin)->put("/template-laporan/{$masterTemplate->id}", [
            'checkpoint_id'          => $masterTemplate->checkpoint_id,
            'name'                   => 'Modified Master Name',
            'description'            => 'Modified',
            'applies_to_report_type' => ReportType::Movement->value,
            'fields'                 => [
                [
                    'field_name'  => 'Only Single Field Now',
                    'field_key'   => 'only_single_field',
                    'label'       => 'Only Single Field',
                    'field_type'  => 'text',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 1,
                ],
            ],
        ]);

        // Verify the existing session checkpoint snapshot remains completely untouched
        $step1Checkpoint->refresh();
        $this->assertEquals($originalFieldsCount, count($step1Checkpoint->template_snapshot['fields']));
        $this->assertEquals($originalPhotoCount, count($step1Checkpoint->template_snapshot['photo_slots']));
        $this->assertEquals($originalSnapshot['template_name'], $step1Checkpoint->template_snapshot['template_name']);
    }

    /** TEST 5: New session captures updated master template snapshot */
    public function test_new_session_captures_updated_master_template_snapshot(): void
    {
        $step1CheckpointMaster = Checkpoint::where('sequence', 1)->firstOrFail();
        $masterTemplate = $step1CheckpointMaster->reportTemplates()->latest()->firstOrFail();

        $this->actingAs($this->superAdmin)->put("/template-laporan/{$masterTemplate->id}", [
            'checkpoint_id'          => $masterTemplate->checkpoint_id,
            'name'                   => 'Brand New Version Template',
            'description'            => 'New SOP',
            'applies_to_report_type' => ReportType::Movement->value,
            'fields'                 => [
                [
                    'field_name'  => 'Custom Field Alpha',
                    'field_key'   => 'custom_field_alpha',
                    'label'       => 'Custom Field Alpha',
                    'field_type'  => 'text',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 1,
                ],
                [
                    'field_name'  => 'Custom Field Beta',
                    'field_key'   => 'custom_field_beta',
                    'label'       => 'Custom Field Beta',
                    'field_type'  => 'number',
                    'required'    => false,
                    'options'     => null,
                    'sort_order'  => 2,
                ],
                [
                    'field_name'  => 'Custom Photo Slot',
                    'field_key'   => 'custom_photo_slot',
                    'label'       => 'Custom Photo Slot',
                    'field_type'  => 'photo',
                    'required'    => true,
                    'options'     => null,
                    'sort_order'  => 3,
                ],
            ],
        ]);

        // Create new session AFTER update
        $newSession = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-NEW-VERSION-001',
            'cargo_name'     => 'Bulldozer D85',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($newSession);

        $newStep1 = SessionCheckpoint::where('shipping_session_id', $newSession->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->firstOrFail();

        $this->assertEquals('Brand New Version Template', $newStep1->template_snapshot['template_name']);
        $this->assertCount(2, $newStep1->template_snapshot['fields']);
        $this->assertCount(1, $newStep1->template_snapshot['photo_slots']);
    }

    /** TEST 6: Deleting template referenced by session checkpoint snapshot is strictly blocked */
    public function test_deleting_template_referenced_by_session_checkpoint_snapshot_is_blocked(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->superAdmin->id,
            'assignment_no'  => 'SES-DELETE-TEST',
            'cargo_name'     => 'Crane 50T',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        app(SessionCheckpointService::class)->createCheckpointsForSession($session);

        $step1 = SessionCheckpoint::where('shipping_session_id', $session->id)
            ->whereHas('checkpoint', fn ($q) => $q->where('sequence', 1))
            ->firstOrFail();

        $templateId = $step1->template_snapshot['template_id'];
        $template = ReportTemplate::findOrFail($templateId);

        $response = $this->actingAs($this->superAdmin)->delete("/template-laporan/{$template->id}");

        $response->assertRedirect('/template-laporan');
        $response->assertSessionHas('error');

        // Verify template still exists
        $this->assertDatabaseHas('report_templates', ['id' => $template->id]);
    }

    /** TEST 7: Deleting unreferenced template succeeds cleanly */
    public function test_deleting_unreferenced_template_succeeds(): void
    {
        $checkpoint = Checkpoint::firstOrFail();

        $template = ReportTemplate::create([
            'checkpoint_id'          => $checkpoint->id,
            'name'                   => 'Temporary Unused Template',
            'description'            => 'To be deleted',
            'applies_to_report_type' => ReportType::Movement->value,
        ]);

        TemplateField::create([
            'template_id' => $template->id,
            'field_name'  => 'Temp Field',
            'field_type'  => 'text',
            'required'    => false,
            'sort_order'  => 1,
        ]);

        $response = $this->actingAs($this->superAdmin)->delete("/template-laporan/{$template->id}");

        $response->assertRedirect('/template-laporan');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('report_templates', ['id' => $template->id]);
        $this->assertDatabaseMissing('template_fields', ['template_id' => $template->id]);
    }

    /** TEST 8: Non Super Admin cannot access or modify report templates */
    public function test_non_super_admin_cannot_access_or_modify_report_templates(): void
    {
        $template = ReportTemplate::firstOrFail();

        $this->actingAs($this->staffUser)
            ->get('/template-laporan')
            ->assertStatus(403);

        $this->actingAs($this->staffUser)
            ->post('/template-laporan', ['name' => 'Hack'])
            ->assertStatus(403);

        $this->actingAs($this->staffUser)
            ->put("/template-laporan/{$template->id}", ['name' => 'Hack'])
            ->assertStatus(403);

        $this->actingAs($this->staffUser)
            ->delete("/template-laporan/{$template->id}")
            ->assertStatus(403);
    }
}
