<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
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

    public function test_staff_or_admin_can_export_reports_as_csv(): void
    {
        $staff = User::factory()->create(['status' => UserStatus::Active->value]);
        $staff->assignRole(UserRole::Staff->value);

        $customer = Customer::create([
            'company_name' => 'PT Ekspor Nusantara',
            'pic_name'     => 'Andi',
            'email'        => 'andi@nusantara.com',
            'phone'        => '0811223344',
        ]);

        ShippingSession::create([
            'customer_id'    => $customer->id,
            'created_by'     => $staff->id,
            'assignment_no'  => 'EXP-2026-001',
            'cargo_name'     => 'Excavator Kobelco',
            'total_quantity' => 1,
            'unit'           => 'unit',
            'status'         => 'in_transit',
        ]);

        $response = $this->actingAs($staff)->get('/laporan/export?format=csv');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertTrue(str_contains((string) $response->headers->get('Content-Disposition'), 'GTD_Laporan_Pengiriman_'));
    }
}
