<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VerifikasiBerkasTest extends TestCase
{
    use DatabaseTransactions;

    private User $supervisorUser;
    private User $customerUser;
    private Customer $customer;
    private DocumentType $docTypeBL;
    private DocumentType $docTypeINV;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);
        Role::firstOrCreate(['name' => 'supervisor']);
        Role::firstOrCreate(['name' => 'staff']);

        $uniq = uniqid();

        $this->customer = Customer::create([
            'company_name' => 'PT Test Logistik ' . $uniq,
            'pic_name'     => 'Budi Supervisor Test',
            'email'        => "cust_{$uniq}@test.com",
            'phone'        => '081299998888',
        ]);

        $this->customerUser = User::create([
            'customer_id'       => $this->customer->id,
            'name'              => 'Customer User ' . $uniq,
            'email'             => "customer_{$uniq}@test.com",
            'password'          => bcrypt('secret123'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->customerUser->assignRole('customer');

        $this->supervisorUser = User::create([
            'name'              => 'Supervisor User ' . $uniq,
            'email'             => "supervisor_{$uniq}@test.com",
            'password'          => bcrypt('secret123'),
            'status'            => UserStatus::Active,
            'email_verified_at' => now(),
        ]);
        $this->supervisorUser->assignRole('supervisor');

        $this->docTypeBL = DocumentType::firstOrCreate(
            ['name' => 'Bill of Lading'],
            ['description' => 'Surat Muatan Kapal']
        );

        $this->docTypeINV = DocumentType::firstOrCreate(
            ['name' => 'Commercial Invoice'],
            ['description' => 'Faktur Komersial']
        );
    }

    public function test_non_supervisor_cannot_access_verification_queue(): void
    {
        $response = $this->actingAs($this->customerUser)->get('/verifikasi-berkas');
        $response->assertStatus(403);
    }

    public function test_supervisor_sees_only_pending_documents_in_queue(): void
    {
        $asgPending = 'ASG-' . uniqid();
        $asgVerified = 'ASG-' . uniqid();

        // Create a PENDING document
        Document::create([
            'assignment_no_ref' => $asgPending,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => [
                'documentDetail' => ['number' => 'BL-PENDING-001', 'date' => '2026-08-28'],
                'shipper'        => ['name' => 'Shipper Corp'],
            ],
            'file_name'         => 'bl_pending.pdf',
            'file_path'         => 'documents/' . $asgPending . '/bl_pending.pdf',
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        // Create an already VERIFIED document (different assignment)
        Document::create([
            'assignment_no_ref' => $asgVerified,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeINV->id,
            'document_data'     => [
                'documentDetail' => ['number' => 'INV-VERIFIED-001', 'date' => '2026-08-28'],
            ],
            'file_name'         => 'inv_verified.pdf',
            'file_path'         => 'documents/' . $asgVerified . '/inv_verified.pdf',
            'status'            => DocumentStatus::VERIFIED,
            'uploaded_by'       => $this->customerUser->id,
            'verified_by'       => $this->supervisorUser->id,
            'verified_at'       => now(),
        ]);

        $response = $this->actingAs($this->supervisorUser)->get('/verifikasi-berkas');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('VerifikasiBerkas/Index', false)
                ->has('documents')
                ->where('documents', function ($docs) use ($asgPending, $asgVerified) {
                    $asgRefs = collect($docs)->pluck('assignmentNoRef');
                    return $asgRefs->contains($asgPending) && !$asgRefs->contains($asgVerified);
                })
            );
    }

    public function test_supervisor_can_view_document_detail(): void
    {
        $asg = 'ASG-' . uniqid();

        $doc = Document::create([
            'assignment_no_ref' => $asg,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => [
                'documentDetail'  => ['number' => 'BL-SHOW-001', 'date' => '2026-08-28'],
                'shipper'         => ['name' => 'PT Sumber Makmur', 'address' => 'Jakarta', 'taxId' => '01.234'],
                'consignee'       => ['name' => 'PT Penerima Makmur', 'address' => 'Surabaya', 'taxId' => '05.678'],
                'transportDetail' => ['portOfLoading' => 'Tanjung Priok', 'portOfDischarge' => 'Tanjung Perak'],
            ],
            'file_name'         => 'bl_show.pdf',
            'file_path'         => 'documents/' . $asg . '/bl_show.pdf',
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->supervisorUser)->get("/verifikasi-berkas/{$asg}");

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('VerifikasiBerkas/Show', false)
                ->where('contractNumber', $asg)
                ->has('documents', 1)
                ->where('documents.0.documentNumber', 'BL-SHOW-001')
                ->where('documents.0.status', 'Pending')
            );
    }

    public function test_supervisor_can_verify_document(): void
    {
        $asg = 'ASG-' . uniqid();

        $doc = Document::create([
            'assignment_no_ref' => $asg,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => [
                'documentDetail' => ['number' => 'BL-VERIFY-001'],
            ],
            'file_name'         => 'bl_verify.pdf',
            'file_path'         => 'documents/' . $asg . '/bl_verify.pdf',
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->supervisorUser)
            ->post("/verifikasi-berkas/{$doc->id}/verify", [
                'notes' => 'All stamps and seals valid.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Document bl_verify.pdf successfully verified.');

        $doc->refresh();
        $this->assertEquals(DocumentStatus::VERIFIED, $doc->status);
        $this->assertEquals($this->supervisorUser->id, $doc->verified_by);
        $this->assertNotNull($doc->verified_at);
        $this->assertEquals('All stamps and seals valid.', $doc->remarks);
    }

    public function test_supervisor_can_reject_document_with_reason(): void
    {
        $asg = 'ASG-' . uniqid();

        $doc = Document::create([
            'assignment_no_ref' => $asg,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => [
                'documentDetail' => ['number' => 'BL-REJECT-001'],
            ],
            'file_name'         => 'bl_reject.pdf',
            'file_path'         => 'documents/' . $asg . '/bl_reject.pdf',
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->supervisorUser)
            ->post("/verifikasi-berkas/{$doc->id}/reject", [
                'notes' => 'Signature missing on page 2.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Document bl_reject.pdf rejected.');

        $doc->refresh();
        $this->assertEquals(DocumentStatus::REJECTED, $doc->status);
        $this->assertEquals($this->supervisorUser->id, $doc->verified_by);
        $this->assertEquals('Signature missing on page 2.', $doc->remarks);
    }

    public function test_rejection_requires_notes(): void
    {
        $asg = 'ASG-' . uniqid();

        $doc = Document::create([
            'assignment_no_ref' => $asg,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => ['documentDetail' => ['number' => 'BL-TEST']],
            'file_name'         => 'bl_test.pdf',
            'file_path'         => 'documents/' . $asg . '/bl_test.pdf',
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->supervisorUser)
            ->post("/verifikasi-berkas/{$doc->id}/reject", [
                'notes' => '',
            ]);

        $response->assertSessionHasErrors('notes');
        $doc->refresh();
        $this->assertEquals(DocumentStatus::PENDING, $doc->status);
    }

    public function test_supervisor_can_preview_uploaded_pdf(): void
    {
        Storage::fake('public');

        $asg = 'ASG-' . uniqid();
        $file = UploadedFile::fake()->create('contract.pdf', 100, 'application/pdf');
        $path = $file->storeAs("documents/{$asg}", 'contract.pdf', 'public');

        $doc = Document::create([
            'assignment_no_ref' => $asg,
            'customer_id'       => $this->customer->id,
            'document_type_id'  => $this->docTypeBL->id,
            'document_data'     => ['documentDetail' => ['number' => 'BL-PDF-001']],
            'file_name'         => 'contract.pdf',
            'file_path'         => $path,
            'status'            => DocumentStatus::PENDING,
            'uploaded_by'       => $this->customerUser->id,
        ]);

        $response = $this->actingAs($this->supervisorUser)->get("/verifikasi-berkas/file/{$doc->id}");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}
