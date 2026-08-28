<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\GlobalSearchService;
use Tests\TestCase;

class GlobalSearchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_global_search_service_finds_all_required_test_cases(): void
    {
        $superAdmin = User::where('email', 'superadmin@lms.local')->first();
        $this->assertNotNull($superAdmin);

        $service = new GlobalSearchService();

        // 1. TRK-2024-001
        $res1 = $service->quickSearch($superAdmin, 'TRK-2024-001');
        $this->assertGreaterThanOrEqual(1, $res1['total_count']);
        $this->assertArrayHasKey('barang', $res1['categories']);

        // 2. Excavator CAT 320
        $res2 = $service->quickSearch($superAdmin, 'Excavator CAT 320');
        $this->assertGreaterThanOrEqual(1, $res2['total_count']);

        // 3. SES-2048
        $res3 = $service->quickSearch($superAdmin, 'SES-2048');
        $this->assertGreaterThanOrEqual(1, $res3['total_count']);

        // 4. Budi S.
        $res4 = $service->quickSearch($superAdmin, 'Budi');
        $this->assertGreaterThanOrEqual(1, $res4['total_count']);

        // 5. INV-2026-014
        $res5 = $service->quickSearch($superAdmin, 'INV-2026-014');
        $this->assertGreaterThanOrEqual(1, $res5['total_count']);
        $this->assertArrayHasKey('dokumen', $res5['categories']);

        // 6. Commercial Invoice
        $res6 = $service->quickSearch($superAdmin, 'Commercial Invoice');
        $this->assertGreaterThanOrEqual(1, $res6['total_count']);

        // 7. PT Customer A
        $res7 = $service->quickSearch($superAdmin, 'PT Customer A');
        $this->assertGreaterThanOrEqual(1, $res7['total_count']);

        // 8. Pelabuhan
        $res8 = $service->quickSearch($superAdmin, 'Pelabuhan');
        $this->assertGreaterThanOrEqual(1, $res8['total_count']);
        $this->assertArrayHasKey('checkpoint', $res8['categories']);
    }

    public function test_customer_cannot_see_other_customer_data(): void
    {
        $customerUser = User::where('email', 'customer@lms.local')->first();
        $this->assertNotNull($customerUser);

        $service = new GlobalSearchService();

        // Customer searching for United Mining (another customer) should get 0 results
        $res = $service->quickSearch($customerUser, 'United Mining');
        $this->assertEquals(0, $res['total_count']);

        // Customer searching for internal users should get 0 results
        $resUsers = $service->searchByCategory($customerUser, 'Admin', 'users');
        $this->assertEmpty($resUsers);
    }

    public function test_global_search_quick_endpoint(): void
    {
        $superAdmin = User::where('email', 'superadmin@lms.local')->first();

        $response = $this->actingAs($superAdmin)->getJson('/global-search/quick?q=Excavator');

        $response->assertOk()
            ->assertJsonStructure([
                'query',
                'categories',
                'total_count',
            ]);
    }

    public function test_global_search_full_page_endpoint(): void
    {
        $superAdmin = User::where('email', 'superadmin@lms.local')->first();

        $response = $this->actingAs($superAdmin)->get('/search?q=Excavator');

        $response->assertOk();
    }
}