<?php

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Enums\UserStatus;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use App\Notifications\DocumentVerifiedNotification;
use App\Notifications\ShipmentCompleted;
use App\Notifications\ShipmentStageUpdated;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerNotificationTest extends TestCase
{
    use DatabaseTransactions;

    private User $customerUserA;
    private Customer $customerA;
    private User $customerUserB;
    private Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);

        $uniqA = uniqid('cust_a_');
        $this->customerA = Customer::create([
            'company_name' => 'PT Mitra Sejahtera ' . $uniqA,
            'pic_name'     => 'Bpk. Hendra',
            'email'        => "{$uniqA}@sejahtera.com",
            'phone'        => '08123456789',
        ]);

        $this->customerUserA = User::create([
            'customer_id'       => $this->customerA->id,
            'name'              => 'Hendra Wijaya',
            'email'             => "{$uniqA}@sejahtera.com",
            'password'          => bcrypt('Secret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->customerUserA->assignRole('customer');

        $uniqB = uniqid('cust_b_');
        $this->customerB = Customer::create([
            'company_name' => 'PT Sumber Rejeki ' . $uniqB,
            'pic_name'     => 'Bpk. Budi',
            'email'        => "{$uniqB}@rejeki.com",
            'phone'        => '08987654321',
        ]);

        $this->customerUserB = User::create([
            'customer_id'       => $this->customerB->id,
            'name'              => 'Budi Santoso',
            'email'             => "{$uniqB}@rejeki.com",
            'password'          => bcrypt('Secret123!'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->customerUserB->assignRole('customer');
    }

    public function test_checkpoint_status_change_creates_database_notification_for_customer(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-NOTIF-01',
            'cargo_name'     => 'Batu Bara',
            'total_quantity' => 1000,
            'unit'           => 'MT',
            'origin'         => 'Banjarmasin',
            'destination'    => 'Merak',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $cp = Checkpoint::firstOrCreate(['name' => 'Pos Pelabuhan Merak', 'sequence' => 1]);

        $sessionCp = SessionCheckpoint::create([
            'shipping_session_id' => $session->id,
            'checkpoint_id'       => $cp->id,
            'status'              => SessionCheckpointStatus::PENDING,
        ]);

        // Trigger checkpoint progress
        $sessionCp->update([
            'status'        => SessionCheckpointStatus::COMPLETED,
            'actual_finish' => now(),
        ]);

        $this->customerUserA->refresh();
        $this->assertCount(1, $this->customerUserA->notifications);

        $notification = $this->customerUserA->notifications->first();
        $this->assertEquals('shipment_stage_updated', $notification->data['type']);
        $this->assertEquals('LTR-NOTIF-01', $notification->data['assignment_no']);
        $this->assertStringContainsString('Pelabuhan Merak', $notification->data['title']);

        // Customer B must NOT receive this notification
        $this->customerUserB->refresh();
        $this->assertCount(0, $this->customerUserB->notifications);
    }

    public function test_document_verification_creates_database_notification_for_customer(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-NOTIF-02',
            'cargo_name'     => 'Alat Berat Excavator',
            'total_quantity' => 2,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Balikpapan',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $docType = DocumentType::firstOrCreate(
            ['name' => 'Bill of Lading'],
            ['description' => 'Surat Muatan Kapal']
        );

        $doc = Document::create([
            'assignment_no_ref'   => 'LTR-NOTIF-02',
            'customer_id'         => $this->customerA->id,
            'shipping_session_id' => $session->id,
            'document_type_id'    => $docType->id,
            'document_data'       => ['bl_no' => 'BL-1001'],
            'file_name'           => 'BL_LTR_NOTIF_02.pdf',
            'file_path'           => 'documents/BL_LTR_NOTIF_02.pdf',
            'status'              => DocumentStatus::PENDING,
            'uploaded_by'         => $this->customerUserA->id,
        ]);

        // Trigger document verification
        $doc->update(['status' => DocumentStatus::APPROVED]);

        $this->customerUserA->refresh();
        $this->assertCount(1, $this->customerUserA->notifications);

        $notification = $this->customerUserA->notifications->first();
        $this->assertEquals('document_verified', $notification->data['type']);
        $this->assertEquals('LTR-NOTIF-02', $notification->data['assignment_no']);
        $this->assertStringContainsString('Bill of Lading', $notification->data['title']);

        // Customer B must NOT receive this notification
        $this->customerUserB->refresh();
        $this->assertCount(0, $this->customerUserB->notifications);
    }

    public function test_shipment_completion_creates_database_notification_for_customer(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-NOTIF-03',
            'cargo_name'     => 'Semen Curah',
            'total_quantity' => 500,
            'unit'           => 'Ton',
            'origin'         => 'Gresik',
            'destination'    => 'Site Batubara Balikpapan',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        // Complete shipment
        $session->update(['status' => ShippingSessionStatus::DELIVERED]);

        $this->customerUserA->refresh();
        $this->assertCount(1, $this->customerUserA->notifications);

        $notification = $this->customerUserA->notifications->first();
        $this->assertEquals('shipment_completed', $notification->data['type']);
        $this->assertEquals('LTR-NOTIF-03', $notification->data['assignment_no']);
        $this->assertStringContainsString('Site Batubara Balikpapan', $notification->data['title']);
    }

    public function test_customer_can_fetch_notifications_via_api(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-API-01',
            'cargo_name'     => 'Muatan Test',
            'total_quantity' => 10,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Surabaya',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $this->customerUserA->notify(new ShipmentCompleted($session));

        $response = $this->actingAs($this->customerUserA)->getJson('/customer/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'unread_count',
                'notifications' => [
                    '*' => ['id', 'type', 'title', 'assignment_no', 'url', 'read_at', 'created_at', 'created_at_human'],
                ],
            ])
            ->assertJson([
                'success'      => true,
                'unread_count' => 1,
            ]);
    }

    public function test_customer_can_mark_single_notification_as_read(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-MARK-01',
            'cargo_name'     => 'Muatan Test',
            'total_quantity' => 10,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Surabaya',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $this->customerUserA->notify(new ShipmentCompleted($session));
        $notification = $this->customerUserA->notifications()->first();

        $this->assertNull($notification->read_at);

        $response = $this->actingAs($this->customerUserA)->postJson("/customer/notifications/{$notification->id}/read");

        $response->assertOk()->assertJson(['success' => true, 'unread_count' => 0]);

        $notification->refresh();
        $this->assertNotNull($notification->read_at);
    }

    public function test_customer_can_mark_all_notifications_as_read(): void
    {
        $session1 = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-ALL-01',
            'cargo_name'     => 'Muatan 1',
            'total_quantity' => 10,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Surabaya',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $session2 = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-ALL-02',
            'cargo_name'     => 'Muatan 2',
            'total_quantity' => 20,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Surabaya',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $this->customerUserA->notify(new ShipmentCompleted($session1));
        $this->customerUserA->notify(new ShipmentCompleted($session2));

        $this->assertEquals(2, $this->customerUserA->unreadNotifications()->count());

        $response = $this->actingAs($this->customerUserA)->postJson('/customer/notifications/read-all');

        $response->assertOk()->assertJson(['success' => true, 'unread_count' => 0]);

        $this->assertEquals(0, $this->customerUserA->unreadNotifications()->count());
    }

    public function test_customer_cannot_mark_other_customers_notification_as_read(): void
    {
        $session = ShippingSession::create([
            'customer_id'    => $this->customerA->id,
            'created_by'     => $this->customerUserA->id,
            'assignment_no'  => 'LTR-PRIV-01',
            'cargo_name'     => 'Muatan Private',
            'total_quantity' => 10,
            'unit'           => 'Unit',
            'origin'         => 'Jakarta',
            'destination'    => 'Surabaya',
            'status'         => ShippingSessionStatus::IN_TRANSIT,
        ]);

        $this->customerUserA->notify(new ShipmentCompleted($session));
        $notificationA = $this->customerUserA->notifications()->first();

        // Customer B tries to mark notification belonging to Customer A
        $response = $this->actingAs($this->customerUserB)->postJson("/customer/notifications/{$notificationA->id}/read");

        $response->assertNotFound();
    }
}
