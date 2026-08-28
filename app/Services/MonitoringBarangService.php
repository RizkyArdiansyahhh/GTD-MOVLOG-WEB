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
     * Menggunakan pendekatan konsolidasi data kargo (merged cargo) seperti pada step Preview PIB.
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
            $cooData = $cooDoc?->document_data ?? [];

            // 1. Ekstraksi & Konsolidasi Data Barang Utama (Merged Cargo CI + PL + BL)
            $ciCargoList  = $ciData['cargoDetail'] ?? [];
            $plCargoList  = $plData['cargoDetail'] ?? [];
            $bolCargoList = $bolData['cargoDetail'] ?? [];

            // Basis data kargo mengutamakan CI, fallback ke PL atau BL jika belum ada CI
            $primaryCargoList = !empty($ciCargoList) 
                ? $ciCargoList 
                : (!empty($plCargoList) ? $plCargoList : $bolCargoList);

            if (!is_array($primaryCargoList)) {
                $primaryCargoList = [];
            }

            $cargos = [];
            $namesList = [];
            $typesList = [];
            $brandsList = [];
            $codesList = [];

            foreach ($primaryCargoList as $idx => $cargo) {
                $plItem  = $plCargoList[$idx] ?? [];
                $bolItem = $bolCargoList[$idx] ?? [];

                $name  = trim((string) ($cargo['descriptionOfGoods'] ?? $plItem['descriptionOfGoods'] ?? $bolItem['descriptionOfGoods'] ?? ''));
                $type  = trim((string) ($cargo['type'] ?? $plItem['type'] ?? ''));
                $brand = trim((string) ($cargo['brand'] ?? $plItem['brand'] ?? ''));
                $code  = trim((string) ($cargo['hsCodePol'] ?? $cargo['hsCodePod'] ?? $plItem['hsCodePol'] ?? $bolItem['hsCodePol'] ?? ''));
                
                $qty   = $cargo['quantityOfGoods'] ?? $plItem['quantityOfGoods'] ?? $cargo['quantityOfPackage'] ?? $plItem['quantityOfPackage'] ?? '-';
                $unit  = $cargo['goodsUnitMeasurement'] ?? $plItem['goodsUnitMeasurement'] ?? $cargo['packageUnitMeasurement'] ?? $plItem['packageUnitMeasurement'] ?? '';
                
                $netWeight   = !empty($plItem['netWeight']) ? (string) $plItem['netWeight'] : '';
                $grossWeight = !empty($plItem['grossWeight']) ? (string) $plItem['grossWeight'] : (!empty($bolItem['grossWeight']) ? (string) $bolItem['grossWeight'] : '');
                
                $price = '';
                if (!empty($cargo['priceOfGoods'])) {
                    $currency = $cargo['currency'] ?? 'USD';
                    $price = $cargo['priceOfGoods'] . ' ' . $currency;
                }

                if (empty($name) && empty($type) && empty($brand)) {
                    continue;
                }

                if (!empty($name)) {
                    $namesList[] = $name;
                }
                if (!empty($type) && $type !== '-') {
                    $typesList[] = $type;
                }
                if (!empty($brand) && $brand !== '-') {
                    $brandsList[] = $brand;
                }
                if (!empty($code) && $code !== '-') {
                    $codesList[] = $code;
                }

                $cargos[] = [
                    'id'                 => (string) ($cargo['id'] ?? ($idx + 1)),
                    'descriptionOfGoods' => $name ?: ('Barang #' . ($idx + 1)),
                    'type'               => $type ?: '-',
                    'brand'              => $brand ?: '-',
                    'quantity'           => $qty,
                    'unit'               => $unit,
                    'netWeight'          => $netWeight,
                    'grossWeight'        => $grossWeight,
                    'price'              => $price,
                    'hsCode'             => $code ?: '-',
                ];
            }

            $uniqueNames  = array_values(array_unique($namesList));
            $uniqueTypes  = array_values(array_unique($typesList));
            $uniqueBrands = array_values(array_unique($brandsList));
            $uniqueCodes  = array_values(array_unique($codesList));

            // Format ringkasan
            $itemName     = !empty($uniqueNames) ? implode(', ', $uniqueNames) : ('Kargo ' . $assignmentRef);
            $itemType     = !empty($uniqueTypes) ? implode(', ', $uniqueTypes) : '-';
            $manufacturer = !empty($uniqueBrands) ? implode(', ', $uniqueBrands) : '-';
            $itemCode     = !empty($uniqueCodes) ? implode(', ', $uniqueCodes) : '-';

            // 2. Ekstraksi Transport & Rute Lokasi
            $transport = $ciData['transportDetail'] 
                ?? $bolData['transportDetail'] 
                ?? $plData['transportDetail'] 
                ?? [];

            $origin = !empty($transport['portOfLoading']) 
                ? $transport['portOfLoading'] 
                : '-';

            $destination = !empty($transport['portOfDischarge']) 
                ? $transport['portOfDischarge'] 
                : '-';

            // 3. Ekstraksi No Kontrak (Dari CI / PL / BL)
            $contractId = $ciData['documentDetail']['shipmentContractNumber']
                ?? $plData['documentDetail']['shipmentContractNumber']
                ?? $bolData['documentDetail']['number']
                ?? '-';

            // 4. Ekstraksi Berat Keseluruhan (Dari Bill of Lading / Packing List)
            $totalWeight = '-';
            if (!empty($bolData['quantity']['totalGrossWeight'])) {
                $unit = $bolData['quantity']['totalGrossWeightUnit'] ?? 'kg';
                $totalWeight = $bolData['quantity']['totalGrossWeight'] . ' ' . $unit;
            } elseif (!empty($plCargoList)) {
                $sumNet = array_reduce($plCargoList, function ($carry, $item) {
                    return $carry + (float) ($item['netWeight'] ?? 0);
                }, 0);
                if ($sumNet > 0) {
                    $totalWeight = $sumNet . ' kg';
                }
            }

            // 5. Normalisasi Status
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

            // 6. Dokumen Lampiran
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
                'itemNames'            => $uniqueNames,
                'itemType'             => $itemType,
                'itemTypes'            => $uniqueTypes,
                'itemCount'            => count($cargos),
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
                'model'                => $itemType,
                'manufacturer'         => $manufacturer,
                'finalDestination'     => $destination,
                'cargos'               => $cargos,
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
