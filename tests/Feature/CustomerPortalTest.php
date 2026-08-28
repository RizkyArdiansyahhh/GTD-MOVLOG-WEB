<?php

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserStatus;
use App\Events\CheckpointProgressUpdated;
use App\Events\DocumentVerified;
use App\Events\ShipmentUpdated;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\SessionCheckpoint;
use App\Models\SessionUnit;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerPortalTest extends TestCase
{
    use DatabaseTransactions;

    private User $customerUser;
    private Customer $customer;
    private User $otherCustomerUser;
    private Customer $otherCustomer;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);
        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'supervisor']);
        Role::firstOrCreate(['name' => 'staff']);

        $uniq = uniqid();

        $this->customer = Customer::create([
            'company_name' => 'PT Mitra Sejahtera Utama ' . $uniq,
            'pic_name'     => 'Bpk. Hendra Wijaya',
            'email'        => "customer_{$uniq}@sejahtera.com",
            'phone'        => '081234567890',
        ]);

        $this->customerUser = User::create([
            'customer_id'       => $this->customer->id,
            'name'              => 'Hendra Wijaya',
            'email'             => "customer_{$uniq}@sejahtera.com",
            'password'          => bcrypt('secret123'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->customerUser->assignRole('customer');

        $this->otherCustomer = Customer::create([
            'company_name' => 'PT Sumber Rejeki ' . $uniq,
            'pic_name'     => 'Bpk. Budi',
            'email'        => "budi_{$uniq}@rejeki.com",
            'phone'        => '089876543210',
        ]);

        $this->otherCustomerUser = User::create([
            'customer_id'       => $this->otherCustomer->id,
            'name'              => 'Budi Santoso',
            'email'             => "budi_{$uniq}@rejeki.com",
            'password'          => bcrypt('secret123'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->otherCustomerUser->assignRole('customer');
    }

    public function test_customer_user_is_redirected_to_customer_dashboard_from_root(): void
    {
        $response = $this->actingAs($this->customerUser)->get('/');
        $response->assertRedirect(route('customer.dashboard'));
    }

    public function test_customer_dashboard_loads_with_real_isolated_data(): void
    {
        $cp = Checkpoint::create([
            'name'     => 'Pelabuhan Merak',
            'sequence' => 1,
        ]);

        $mySession = ShippingSession::create([
            'customer_id'           => $this->customer->id,
            'created_by'            => $this->customerUser->id,
            'assignment_no'         => 'LTR-99001',
            'cargo_name'            => 'Batu Bara Bituminous',
            'total_quantity'        => 5000,
            'unit'                  => 'MT',
            'origin'                => 'Banjarmasin',
            'destination'           => 'Merak',
            'status'                => ShippingSessionStatus::IN_TRANSIT,
            'current_checkpoint_id' => $cp->id,
        ]);

        $otherSession = ShippingSession::create([
            'customer_id'           => $this->otherCustomer->id,
            'created_by'            => $this->otherCustomerUser->id,
            'assignment_no'         => 'LTR-99002',
            'cargo_name'            => 'Kayu Sengon',
            'total_quantity'        => 1200,
            'unit'                  => 'M3',
            'origin'                => 'Surabaya',
            'destination'           => 'Jakarta',
            'status'                => ShippingSessionStatus::IN_TRANSIT,
            'current_checkpoint_id' => $cp->id,
        ]);

        $response = $this->actingAs($this->customerUser)->get('/customer/dashboard');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/Dashboard', false)
                ->has('customer', fn (Assert $c) => $c
                    ->where('id', (string) $this->customer->id)
                    ->where('company_name', $this->customer->company_name)
                    ->where('pic_name', 'Bpk. Hendra Wijaya')
                )
                ->has('stats', fn (Assert $s) => $s
                    ->where('total_shipments', 1)
                    ->where('active_shipments', 1)
                    ->where('in_transit', 1)
                    ->where('total_cargo_tonnage', 5000)
                    ->etc()
                )
                ->has('recentShipments', 1)
                ->where('recentShipments.0.assignment_no', 'LTR-99001')
                ->where('recentShipments.0.cargo_name', 'Batu Bara Bituminous')
                ->has('checkpointGroups')
            );
    }

    public function test_customer_monitoring_barang_filters_by_search(): void
    {
        ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->customerUser->id,
            'assignment_no'  => 'LTR-1001',
            'cargo_name'     => 'Excavator Kobelco',
            'total_quantity' => 2,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Balikpapan',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->customerUser->id,
            'assignment_no'  => 'LTR-1002',
            'cargo_name'     => 'Semen Gresik',
            'total_quantity' => 1000,
            'unit'           => 'Ton',
            'origin'         => 'Gresik',
            'destination'    => 'Pontianak',
            'status'         => ShippingSessionStatus::DELIVERED,
        ]);

        $response = $this->actingAs($this->customerUser)
            ->get('/customer/monitoring-barang?search=Excavator');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/MonitoringBarang', false)
                ->has('shipments.data', 1)
                ->where('shipments.data.0.assignment_no', 'LTR-1001')
            );
    }

    public function test_customer_shipment_detail_only_shows_verified_documents(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->customerUser->id,
            'assignment_no'  => 'LTR-5501',
            'cargo_name'     => 'Muatan Baja Profil',
            'total_quantity' => 300,
            'unit'           => 'Ton',
            'origin'         => 'Cilegon',
            'destination'    => 'Makassar',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $docType = DocumentType::firstOrCreate(
            ['name' => 'Bill of Lading'],
            ['description' => 'Surat Muatan Kapal']
        );

        $supervisor = User::create([
            'name'              => 'Supervisor Operasional',
            'email'             => 'spv_' . uniqid() . '@gtd.co.id',
            'password'          => bcrypt('secret'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);

        // Verified Document (APPROVED / VERIFIED)
        Document::create([
            'assignment_no_ref'   => 'LTR-5501',
            'customer_id'         => $this->customer->id,
            'shipping_session_id' => $session->id,
            'document_type_id'    => $docType->id,
            'document_data'       => ['ref' => 'BL-001'],
            'file_name'           => 'BL_LTR5501_Verified.pdf',
            'file_path'           => 'documents/BL_LTR5501_Verified.pdf',
            'status'              => DocumentStatus::VERIFIED,
            'uploaded_by'         => $this->customerUser->id,
            'verified_by'         => $supervisor->id,
            'verified_at'         => now(),
        ]);

        // Another doc type for pending doc
        $docType2 = DocumentType::firstOrCreate(
            ['name' => 'Commercial Invoice'],
            ['description' => 'Invoice Komersial']
        );

        // Pending Document (should NOT appear)
        Document::create([
            'assignment_no_ref'   => 'LTR-5501',
            'customer_id'         => $this->customer->id,
            'shipping_session_id' => $session->id,
            'document_type_id'    => $docType2->id,
            'document_data'       => ['ref' => 'INV-001'],
            'file_name'           => 'INV_Pending.pdf',
            'file_path'           => 'documents/INV_Pending.pdf',
            'status'              => DocumentStatus::PENDING,
            'uploaded_by'         => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->customerUser)->get("/customer/shipment/{$session->id}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Customer/DetailShipment', false)
                ->has('shipment', fn (Assert $s) => $s
                    ->where('id', (string) $session->id)
                    ->where('assignment_no', 'LTR-5501')
                    ->etc()
                )
                ->has('documents', 1)
                ->where('documents.0.file_name', 'BL_LTR5501_Verified.pdf')
            );
    }

    public function test_customer_cannot_view_other_customer_shipment_detail(): void
    {
        $otherSession = ShippingSession::create([
            'customer_id'    => $this->otherCustomer->id,
            'created_by'     => $this->otherCustomerUser->id,
            'assignment_no'  => 'LTR-PRIVATE',
            'cargo_name'     => 'Kargo Rahasia',
            'total_quantity' => 10,
            'unit'           => 'Ton',
            'origin'         => 'Rahasia',
            'destination'    => 'Rahasia',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $response = $this->actingAs($this->customerUser)->get("/customer/shipment/{$otherSession->id}");
        $response->assertForbidden();
    }

    public function test_customer_cannot_see_other_customers_shipments(): void
    {
        $customerA = Customer::factory()->create();
        $customerB = Customer::factory()->create();

        $userA = User::factory()->create(['customer_id' => $customerA->id]);
        $userA->assignRole('customer');

        $sessionB = ShippingSession::factory()->create(['customer_id' => $customerB->id]);

        $response = $this->actingAs($userA)->get("/customer/monitoring-barang/{$sessionB->id}");
        $response->assertForbidden(); // harus 403, bukan menampilkan data customerB

        $responseShipment = $this->actingAs($userA)->get("/customer/shipment/{$sessionB->id}");
        $responseShipment->assertForbidden();
    }

    public function test_customer_with_no_customer_id_is_blocked_not_fallback(): void
    {
        $userWithoutCustomer = User::factory()->create(['customer_id' => null]);
        $userWithoutCustomer->assignRole('customer');

        $response = $this->actingAs($userWithoutCustomer)->get('/customer/dashboard');
        $response->assertForbidden(); // BUKAN 200 dengan data customer pertama
    }

    public function test_observers_trigger_broadcast_events(): void
    {
        Event::fake([
            ShipmentUpdated::class,
            CheckpointProgressUpdated::class,
            DocumentVerified::class,
        ]);

        $session = ShippingSession::create([
            'customer_id'    => $this->customer->id,
            'created_by'     => $this->customerUser->id,
            'assignment_no'  => 'LTR-EVENT-01',
            'cargo_name'     => 'Alat Berat',
            'total_quantity' => 50,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Samarinda',
            'status'         => ShippingSessionStatus::PENDING,
        ]);

        // Trigger session update
        $session->update(['status' => ShippingSessionStatus::IN_TRANSIT]);

        Event::assertDispatched(ShipmentUpdated::class, function ($event) {
            return $event->customerId === (string) $this->customer->id;
        });

        // Test checkpoint progress update
        $cp = Checkpoint::firstOrCreate(['name' => 'Pos A', 'sequence' => 1]);
        $sessionCp = SessionCheckpoint::create([
            'shipping_session_id' => $session->id,
            'checkpoint_id'       => $cp->id,
            'status'              => SessionCheckpointStatus::IN_PROGRESS,
            'actual_start'        => now(),
        ]);

        $sessionCp->update([
            'status'        => SessionCheckpointStatus::COMPLETED,
            'actual_finish' => now(),
        ]);

        Event::assertDispatched(CheckpointProgressUpdated::class, function ($event) use ($session) {
            return $event->sessionId === (string) $session->id && $event->customerId === (string) $this->customer->id;
        });

        // Test document verified event
        $docType = DocumentType::firstOrCreate(['name' => 'COO'], ['description' => 'Origin']);
        $doc = Document::create([
            'assignment_no_ref'   => 'LTR-EVENT-01',
            'customer_id'         => $this->customer->id,
            'shipping_session_id' => $session->id,
            'document_type_id'    => $docType->id,
            'document_data'       => [],
            'file_name'           => 'coo.pdf',
            'file_path'           => 'docs/coo.pdf',
            'status'              => DocumentStatus::PENDING,
            'uploaded_by'         => $this->customerUser->id,
        ]);

        $doc->update(['status' => DocumentStatus::VERIFIED]);

        Event::assertDispatched(DocumentVerified::class, function ($event) {
            return $event->customerId === (string) $this->customer->id && $event->assignmentNo === 'LTR-EVENT-01';
        });
    }
}