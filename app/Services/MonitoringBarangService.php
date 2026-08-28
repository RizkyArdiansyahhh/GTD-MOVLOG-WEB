<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DocumentStatus;
use App\Models\Document;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class MonitoringBarangService
{
    /**
     * Mengambil dan memetakan seluruh assignment berkas menjadi data monitoring barang.
     */
    public function getMonitoringItems(): Collection
    {
        $assignments = Document::with(['customer', 'uploadedBy', 'documentType'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('assignment_no_ref');

        return $assignments->map(function (Collection $docs, string $assignmentRef) {
            $bolDoc = $docs->firstWhere('document_type_id', 1); // Bill of Lading
            $ciDoc  = $docs->firstWhere('document_type_id', 2); // Commercial Invoice
            $plDoc  = $docs->firstWhere('document_type_id', 3); // Packing List
            $cooDoc = $docs->firstWhere('document_type_id', 4); // COO
            $insDoc = $docs->firstWhere('document_type_id', 5); // Insurance

            $firstDoc = $docs->first();
            $customer = $firstDoc?->customer;
            $uploader = $firstDoc?->uploadedBy;

            $bolData = $bolDoc?->document_data ?? [];
            $ciData  = $ciDoc?->document_data ?? [];
            $plData  = $plDoc?->document_data ?? [];

            // 1. Ekstraksi Cargo Detail
            $firstCargo = $bolData['cargoDetail'][0] 
                ?? $ciData['cargoDetail'][0] 
                ?? $plData['cargoDetail'][0] 
                ?? [];
            
            $itemName = !empty($firstCargo['descriptionOfGoods'])
                ? $firstCargo['descriptionOfGoods']
                : ('Kargo ' . $assignmentRef);

            $itemCode = $firstCargo['hsCodePol'] 
                ?? $firstCargo['hsCodePod'] 
                ?? $firstCargo['id'] 
                ?? '-';

            // 2. Ekstraksi Transport & Lokasi
            $transport = $bolData['transportDetail'] 
                ?? $ciData['transportDetail'] 
                ?? $plData['transportDetail'] 
                ?? [];

            $origin = !empty($transport['portOfLoading']) 
                ? $transport['portOfLoading'] 
                : '-';

            $destination = !empty($transport['portOfDischarge']) 
                ? $transport['portOfDischarge'] 
                : '-';

            // 3. Ekstraksi No Kontrak
            $contractId = $ciData['documentDetail']['shipmentContractNumber']
                ?? $plData['documentDetail']['shipmentContractNumber']
                ?? $bolData['documentDetail']['number']
                ?? $assignmentRef;

            // 4. Ekstraksi Berat Total
            $totalWeight = '-';
            if (!empty($bolData['quantity']['totalGrossWeight'])) {
                $unit = $bolData['quantity']['totalGrossWeightUnit'] ?? 'kg';
                $totalWeight = $bolData['quantity']['totalGrossWeight'] . ' ' . $unit;
            } elseif (!empty($firstCargo['grossWeight'])) {
                $totalWeight = $firstCargo['grossWeight'] . ' kg';
            }

            // 5. Ekstraksi Model & Manufaktur
            $model = $plData['cargoDetail'][0]['type'] 
                ?? $ciData['cargoDetail'][0]['type'] 
                ?? '-';

            $manufacturer = $plData['cargoDetail'][0]['brand'] 
                ?? $ciData['cargoDetail'][0]['brand'] 
                ?? '-';

            // 6. Normalisasi dan Mapping Status Dokumen & Pengiriman
            $statuses = $docs->map(function ($doc) {
                if ($doc->status instanceof DocumentStatus) {
                    return $doc->status->value;
                }
                return (string) $doc->status;
            });

            $status = match (true) {
                $statuses->contains(DocumentStatus::VERIFIED->value) => 'Dalam Perjalanan',
                $statuses->contains(DocumentStatus::REJECTED->value) => 'Dibatalkan',
                $statuses->contains(DocumentStatus::PENDING->value)  => 'Menunggu',
                default                                              => 'Menunggu',
            };

            // 7. Mapping Dokumen Lampiran
            $documentItems = $docs->map(function ($doc) {
                $rawStatus = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;
                $statusLabel = match ($rawStatus) {
                    'VERIFIED' => 'Disetujui',
                    'REJECTED' => 'Ditolak',
                    'PENDING'  => 'Menunggu Verifikasi',
                    default    => 'Draft',
                };

                return [
                    'id'          => (string) $doc->id,
                    'name'        => $doc->file_name ?? $doc->documentType?->name ?? 'Dokumen',
                    'type'        => $doc->documentType?->name ?? 'Dokumen',
                    'status'      => $statusLabel,
                    'uploadedBy'  => $doc->uploadedBy?->name ?? '-',
                    'uploadedAt'  => $doc->uploaded_at?->toISOString() ?? $doc->created_at?->toISOString(),
                    'fileUrl'     => $doc->file_path ? Storage::url($doc->file_path) : null,
                ];
            })->values()->all();

            $formattedDate = $firstDoc?->created_at ? $firstDoc->created_at->format('d M Y') : date('d M Y');
            $formattedTime = $firstDoc?->created_at ? $firstDoc->created_at->format('H:i') : '00:00';

            return [
                'id'                   => $assignmentRef,
                'contractId'           => $contractId,
                'shippingSession'      => $assignmentRef,
                'customerName'         => $customer?->company_name ?? 'Customer Tidak Diketahui',
                'itemName'             => $itemName,
                'itemType'             => $firstCargo['type'] ?? 'General Cargo',
                'origin'               => $origin,
                'destination'          => $destination,
                'status'               => $status,
                'lastUpdate'           => $firstDoc?->updated_at?->toISOString() ?? now()->toISOString(),
                'estimatedArrival'     => '-',
                'createdBy'            => $uploader?->name ?? 'Staff',
                'currentCheckpoint'    => $origin,
                'totalCheckpoints'     => 4,
                'completedCheckpoints' => $status === 'Dalam Perjalanan' ? 1 : 0,
                'itemCode'             => $itemCode,
                'currentLocation'      => $origin,
                'totalWeight'          => $totalWeight,
                'model'                => $model,
                'manufacturer'         => $manufacturer,
                'finalDestination'     => $destination,
                'checkpoints'          => [
                    [
                        'id' => 'cp1',
                        'name' => 'Pemuatan di ' . $origin,
                        'status' => $status === 'Dalam Perjalanan' ? 'completed' : 'pending',
                        'date' => $formattedDate,
                        'time' => $formattedTime,
                        'notes' => $status === 'Dalam Perjalanan' ? 'Dokumen diverifikasi & muatan siap berangkat' : 'Menunggu verifikasi berkas',
                    ],
                    ['id' => 'cp2', 'name' => 'Transit Transportasi', 'status' => $status === 'Dalam Perjalanan' ? 'current' : 'pending'],
                    ['id' => 'cp3', 'name' => 'Bongkar Muat di ' . $destination, 'status' => 'pending'],
                    ['id' => 'cp4', 'name' => 'Pengiriman ke Lokasi Akhir', 'status' => 'pending'],
                ],
                'documents'            => $documentItems,
                'reports'              => [],
                'photos'               => [],
                'activities'           => [
                    [
                        'id'    => 'act-' . $assignmentRef,
                        'time'  => $formattedTime,
                        'date'  => $formattedDate,
                        'title' => $status === 'Dalam Perjalanan' 
                            ? 'Dokumen disetujui & pengiriman aktif' 
                            : ('Berkas disubmit (' . $docs->count() . ' dokumen)'),
                        'user'  => $uploader?->name ?? 'Staff',
                        'role'  => 'Staff Operasional',
                    ],
                ],
            ];
        })->values();
    }
}