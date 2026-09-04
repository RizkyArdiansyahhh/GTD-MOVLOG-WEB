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
        $session4 = ShippingSession::where('assignment_no', 'TRK-2024-003')->first();
        $session5 = ShippingSession::where('assignment_no', 'TRK-2024-004')->first();

        $typeInvoice = DocumentType::where('name', 'Commercial Invoice')->first();
        $typeBL = DocumentType::where('name', 'Bill of Lading')->first();
        $typePacking = DocumentType::where('name', 'Packing List')->first();
        $typeInsurance = DocumentType::where('name', 'Insurance')->first();
        $typeCOO = DocumentType::where('name', 'Certificate of Origin (COO)')->first();

        $docs = [
            // Session 1: TRK-2024-001
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
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(2),
                'remarks'             => 'Invoice diverifikasi dan disetujui',
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
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(2),
                'remarks'             => 'Dokumen B/L valid dan telah ditandatangani pihak agen',
            ],
            [
                'shipping_session_id' => $session1?->id,
                'document_type_id'    => $typePacking?->id,
                'document_data'       => [
                    'document_number'    => 'PL-2026-022',
                    'title'              => 'Packing List Alat Berat & Spareparts',
                    'total_packages'     => '3 Units / 12 Crates',
                    'total_gross_weight' => '48,500 KG',
                    'shipment_reference' => 'TRK-2024-001',
                ],
                'file_name'           => 'PL-2026-022_Packing_List.pdf',
                'file_path'           => 'documents/PL-2026-022.pdf',
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(2),
                'remarks'             => 'Jumlah koli dan tonase sesuai manifest',
            ],
            // Session 2: SES-2048
            [
                'shipping_session_id' => $session2?->id,
                'document_type_id'    => $typeInsurance?->id,
                'document_data'       => [
                    'document_number'    => 'INS-2026-003',
                    'title'              => 'Marine Cargo Insurance Policy',
                    'insurance_company'  => 'PT Asuransi Wahana Tata',
                    'sum_insured'        => 'IDR 5,000,000,000',
                    'shipment_reference' => 'SES-2048',
                ],
                'file_name'           => 'INS-2026-003_Insurance_Policy.pdf',
                'file_path'           => 'documents/INS-2026-003.pdf',
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(1),
                'remarks'             => 'Polis asuransi disetujui',
            ],
            // Session 3: TRK-2024-002
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
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(1),
                'remarks'             => 'Sertifikat asal diverifikasi',
            ],
            // Session 4: TRK-2024-003
            [
                'shipping_session_id' => $session4?->id,
                'document_type_id'    => $typeBL?->id,
                'document_data'       => [
                    'document_number'    => 'BL-2026-015',
                    'title'              => 'Bill of Lading Balikpapan - Muara Wahau',
                    'carrier'            => 'Kariangau Sea Transport',
                    'vessel_name'        => 'LCT Borneo Express 02',
                    'shipment_reference' => 'TRK-2024-003',
                ],
                'file_name'           => 'BL-2026-015_Bill_of_Lading.pdf',
                'file_path'           => 'documents/BL-2026-015.pdf',
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(4),
                'remarks'             => 'Pengiriman telah selesai dan diterima di site',
            ],
            // Session 5: TRK-2024-004
            [
                'shipping_session_id' => $session5?->id,
                'document_type_id'    => $typeInvoice?->id,
                'document_data'       => [
                    'document_number'    => 'INV-2026-088',
                    'title'              => 'Commercial Invoice Generator Set Cummins 1500 kVA',
                    'total_amount'       => 'USD 190,000',
                    'shipper'            => 'PT Trans Cargo Indonesia',
                    'consignee'          => 'PT Vale Indonesia',
                    'shipment_reference' => 'TRK-2024-004',
                ],
                'file_name'           => 'INV-2026-088_Commercial_Invoice.pdf',
                'file_path'           => 'documents/INV-2026-088.pdf',
                'status'              => 'VERIFIED',
                'uploaded_by'         => $staff?->id,
                'verified_by'         => $supervisor?->id,
                'verified_at'         => now()->subDays(1),
                'remarks'             => 'Invoice generator terverifikasi',
            ],
        ];

        foreach ($docs as $item) {
            if ($item['shipping_session_id'] && $item['document_type_id'] && $item['uploaded_by']) {
                $session = ShippingSession::find($item['shipping_session_id']);
                $item['customer_id'] = $session?->customer_id;
                $item['assignment_no_ref'] = $session?->assignment_no ?? 'TRK-2024-001';

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
