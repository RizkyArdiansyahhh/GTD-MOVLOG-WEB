<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ShippingSessionStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Database\Seeders\CheckpointSeeder;
use Database\Seeders\ReportTemplateSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LaporanExportTest extends TestCase
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

    public function test_unsupported_format_is_rejected(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $response = $this->actingAs($staff)->postJson('/laporan/export', [
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date'   => now()->toDateString(),
            'format'     => 'csv',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['format']);
    }

    public function test_staff_can_preview_report_with_executive_summary(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $customer = Customer::create([
            'company_name' => 'PT Harapan Bangsa',
            'pic_name'     => 'Budi',
            'email'        => 'budi@harapan.com',
            'phone'        => '0812345678',
        ]);

        ShippingSession::create([
            'customer_id'    => $customer->id,
            'created_by'     => $staff->id,
            'assignment_no'  => 'EXP-2026-002',
            'cargo_name'     => 'Bulldozer Cat D8R',
            'total_quantity' => 2,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::IN_TRANSIT->value,
            'created_at'     => now(),
        ]);

        $response = $this->actingAs($staff)->postJson('/laporan/preview', [
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date'   => now()->toDateString(),
            'format'     => 'pdf',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'period' => ['start', 'end'],
            'total_sessions',
            'status_breakdown',
            'checkpoint_breakdown',
            'operational_narrative',
            'operational_highlights',
            'delivered_count',
            'in_transit_count',
            'generated_by',
            'generated_at',
        ]);

        $data = $response->json();
        $this->assertSame(1, $data['total_sessions']);
        $this->assertNotEmpty($data['operational_narrative']);
        $this->assertNotEmpty($data['operational_highlights']);
    }

    public function test_staff_can_export_report_as_pdf(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $customer = Customer::create([
            'company_name' => 'PT Citra Kargo',
            'pic_name'     => 'Cici',
            'email'        => 'cici@citra.com',
            'phone'        => '0813998877',
        ]);

        ShippingSession::create([
            'customer_id'    => $customer->id,
            'created_by'     => $staff->id,
            'assignment_no'  => 'EXP-2026-003',
            'cargo_name'     => 'Dump Truck 20T',
            'total_quantity' => 5,
            'unit'           => 'unit',
            'status'         => ShippingSessionStatus::DELIVERED->value,
            'created_at'     => now(),
        ]);

        $response = $this->actingAs($staff)->post('/laporan/export', [
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date'   => now()->toDateString(),
            'format'     => 'pdf',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertTrue(str_contains((string) $response->headers->get('Content-Disposition'), 'GTD_Laporan_'));
    }

    public function test_staff_can_export_report_as_excel(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $customer = Customer::create([
            'company_name' => 'PT Semen Maju',
            'pic_name'     => 'Dodi',
            'email'        => 'dodi@semen.com',
            'phone'        => '0815556677',
        ]);

        ShippingSession::create([
            'customer_id'    => $customer->id,
            'created_by'     => $staff->id,
            'assignment_no'  => 'EXP-2026-004',
            'cargo_name'     => 'Semen Curah 50T',
            'total_quantity' => 50,
            'unit'           => 'ton',
            'status'         => ShippingSessionStatus::IN_TRANSIT->value,
            'created_at'     => now(),
        ]);

        $response = $this->actingAs($staff)->post('/laporan/export', [
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date'   => now()->toDateString(),
            'format'     => 'excel',
        ]);

        $response->assertStatus(200);
        $disposition = (string) $response->headers->get('Content-Disposition');
        $this->assertTrue(str_contains($disposition, 'GTD_Laporan_') && str_contains($disposition, '.xlsx'));
    }

    public function test_empty_period_returns_informative_summary(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $response = $this->actingAs($staff)->postJson('/laporan/preview', [
            'start_date' => '2020-01-01',
            'end_date'   => '2020-01-07',
            'format'     => 'pdf',
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertSame(0, $data['total_sessions']);
        $this->assertStringContainsString('Tidak terdapat aktivitas pengiriman', $data['operational_narrative']);
    }

    public function test_guest_cannot_access_reports(): void
    {
        $response = $this->get('/laporan');
        $response->assertRedirect('/login');

        $responseExport = $this->post('/laporan/export', [
            'start_date' => now()->subDays(7)->toDateString(),
            'end_date'   => now()->toDateString(),
            'format'     => 'pdf',
        ]);
        $responseExport->assertRedirect('/login');
    }
}
