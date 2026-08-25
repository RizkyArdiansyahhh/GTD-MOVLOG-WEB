<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::where('email', 'staff@lms.local')->first();
        $supervisor = User::where('email', 'supervisor@lms.local')->first();

        $session1 = ShippingSession::where('assignment_no', 'TRK-2024-001')->first();
        $session2 = ShippingSession::where('assignment_no', 'SES-2048')->first();
        $session3 = ShippingSession::where('assignment_no', 'TRK-2024-002')->first();

        $typeInvoice = DocumentType::where('name', 'Commercial Invoice')->first();
        $typeBL = DocumentType::where('name', 'Bill of Lading')->first();
        $typePacking = DocumentType::where('name', 'Packing List')->first();
        $typeInsurance = DocumentType::where('name', 'Insurance')->first();
        $typeCOO = DocumentType::where('name', 'Certificate of Origin (COO)')->first();

        $docs = [
            [
                'shipping_session_id' => $session1?->id,
                'document_type_id'    => $typeInvoice?->id,
                'document_data'       => [
                    'document_number'    => 'INV-2026-014',
                    'title'              => 'Commercial Invoice Excavator CAT 320',
                    'total_amount'       => 'USD 145,000',
                    'shipper'            => 'PT Heavy Equipment Indo',
                    'consignee'          => 'PT Customer A',
                    'shipment_reference' => 'TRK-2024-001',
                ],
                'file_name'           => 'INV-2026-014_Commercial_Invoice.pdf',
                'file_path'           => 'documents/INV-2026-014.pdf',
                'status'              => 'PENDING',
                'uploaded_by'         => $staff?->id,
                'remarks'             => 'Menunggu verifikasi nilai invoice dan stempel bea cukai',
            ],
            [
                'shipping_session_id' => $session1?->id,
                'document_type_id'    => $typeBL?->id,
                'document_data'       => [
                    'document_number'    => 'BL-2026-008',
                    'title'              => 'Bill of Lading Tanjung Priok - Balikpapan',
                    'carrier'            => 'Samudera Shipping Line',
                    'vessel_name'        => 'KM Nusantara Jaya 08',
                    'shipment_reference' => 'TRK-2024-001',
                ],
                'file_name'           => 'BL-2026-008_Bill_of_Lading.pdf',
                'file_path'           => 'documents/BL-2026-008.pdf',
                'status'              => 'APPROVED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(2),
                'remarks'             => 'Dokumen sah dan terverifikasi',
            ],
            [
                'shipping_session_id' => $session2?->id,
                'document_type_id'    => $typePacking?->id,
                'document_data'       => [
                    'document_number'    => 'PL-2026-015',
                    'title'              => 'Packing List CAT 320 GC & Spareparts',
                    'gross_weight'       => '22,400 KG',
                    'packages'           => '2 Units + 4 Crates',
                    'shipment_reference' => 'SES-2048',
                ],
                'file_name'           => 'PL-2026-015_Packing_List.pdf',
                'file_path'           => 'documents/PL-2026-015.pdf',
                'status'              => 'PENDING',
                'uploaded_by'         => $staff?->id,
                'remarks'             => 'Menunggu verifikasi manifest kargo',
            ],
            [
                'shipping_session_id' => $session2?->id,
                'document_type_id'    => $typeInsurance?->id,
                'document_data'       => [
                    'document_number'    => 'INS-2026-003',
                    'title'              => 'Marine Cargo Insurance Policy',
                    'insurer'            => 'Asuransi Wahana Tata',
                    'coverage'           => 'All Risks Institute Cargo Clauses (A)',
                    'shipment_reference' => 'SES-2048',
                ],
                'file_name'           => 'INS-2026-003_Marine_Insurance.pdf',
                'file_path'           => 'documents/INS-2026-003.pdf',
                'status'              => 'APPROVED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDay(),
                'remarks'             => 'Polis asuransi valid aktif',
            ],
            [
                'shipping_session_id' => $session3?->id,
                'document_type_id'    => $typeCOO?->id,
                'document_data'       => [
                    'document_number'    => 'COO-2026-009',
                    'title'              => 'Certificate of Origin Dump Truck Hino',
                    'country_of_origin'  => 'Indonesia',
                    'shipment_reference' => 'TRK-2024-002',
                ],
                'file_name'           => 'COO-2026-009_Origin_Certificate.pdf',
                'file_path'           => 'documents/COO-2026-009.pdf',
                'status'              => 'PENDING',
                'uploaded_by'         => $staff?->id,
                'remarks'             => 'Pemeriksaan form sertifikat asal',
            ],
        ];

        foreach ($docs as $item) {
            if ($item['shipping_session_id'] && $item['document_type_id'] && $item['uploaded_by']) {
                Document::firstOrCreate(
                    [
                        'shipping_session_id' => $item['shipping_session_id'],
                        'document_type_id'    => $item['document_type_id'],
                        'file_name'           => $item['file_name'],
                    ],
                    $item
                );
            }
        }
    }
}
