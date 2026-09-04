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
                    'descriptionOfGoods' => $name ?: ('Cargo Item #' . ($idx + 1)),
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

            // Fallback jika data dokumen berbentuk flat (seperti pada data seeder / legacy payload)
            if (empty($cargos)) {
                $rawTitle = $ciData['title'] ?? $plData['title'] ?? $bolData['title'] ?? null;
                $cleanTitle = $rawTitle ? preg_replace('/^(Commercial Invoice|Packing List|Bill of Lading)\s+/i', '', (string) $rawTitle) : null;
                $fallbackGoods = $cleanTitle ?: ($ciData['descriptionOfGoods'] ?? null);

                if ($fallbackGoods) {
                    $namesList[] = $fallbackGoods;
                    $fallbackQty = $plData['total_packages'] ?? ($ciData['total_packages'] ?? '1 Unit');
                    $fallbackWeight = $plData['total_gross_weight'] ?? ($bolData['total_gross_weight'] ?? '-');

                    $cargos[] = [
                        'id'                 => '1',
                        'descriptionOfGoods' => $fallbackGoods,
                        'type'               => 'Heavy Equipment / Cargo',
                        'brand'              => '-',
                        'quantity'           => $fallbackQty,
                        'unit'               => 'Unit',
                        'netWeight'          => '-',
                        'grossWeight'        => $fallbackWeight,
                        'price'              => $ciData['total_amount'] ?? '-',
                        'hsCode'             => '-',
                    ];
                }
            }

            $uniqueNames  = array_values(array_unique($namesList));
            $uniqueTypes  = array_values(array_unique($typesList));
            $uniqueBrands = array_values(array_unique($brandsList));
            $uniqueCodes  = array_values(array_unique($codesList));

            // Format ringkasan
            $itemName     = !empty($uniqueNames) ? implode(', ', $uniqueNames) : ('Kargo ' . $assignmentRef);
            $itemType     = !empty($uniqueTypes) ? implode(', ', $uniqueTypes) : 'Heavy Equipment';
            $manufacturer = !empty($uniqueBrands) ? implode(', ', $uniqueBrands) : '-';
            $itemCode     = !empty($uniqueCodes) ? implode(', ', $uniqueCodes) : '-';

            // 2. Ekstraksi Transport & Rute Lokasi
            $transport = $ciData['transportDetail'] 
                ?? $bolData['transportDetail'] 
                ?? $plData['transportDetail'] 
                ?? [];

            $origin = !empty($transport['portOfLoading']) 
                ? $transport['portOfLoading'] 
                : (!empty($bolData['port_of_loading']) ? $bolData['port_of_loading'] : '-');

            $destination = !empty($transport['portOfDischarge']) 
                ? $transport['portOfDischarge'] 
                : (!empty($bolData['port_of_discharge']) ? $bolData['port_of_discharge'] : '-');

            // Fallback parsing rute dari judul Bill of Lading (misal: "Bill of Lading Tanjung Priok - Balikpapan")
            if (($origin === '-' || $destination === '-') && !empty($bolData['title'])) {
                if (preg_match('/Bill of Lading\s+(.+?)\s*-\s*(.+)/i', (string) $bolData['title'], $matches)) {
                    if ($origin === '-') {
                        $origin = trim($matches[1]);
                    }
                    if ($destination === '-') {
                        $destination = trim($matches[2]);
                    }
                }
            }

            // 3. Ekstraksi No Kontrak (Dari CI / PL / BL)
            $contractId = $ciData['documentDetail']['shipmentContractNumber']
                ?? $plData['documentDetail']['shipmentContractNumber']
                ?? $bolData['documentDetail']['number']
                ?? $ciData['document_number']
                ?? $bolData['document_number']
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
            } elseif (!empty($plData['total_gross_weight'])) {
                $totalWeight = (string) $plData['total_gross_weight'];
            } elseif (!empty($bolData['total_gross_weight'])) {
                $totalWeight = (string) $bolData['total_gross_weight'];
            }

            // 5. Normalisasi Status Dokumen
            $statuses = $docs->map(function ($doc) {
                if ($doc->status instanceof DocumentStatus) {
                    return $doc->status->value;
                }
                return (string) $doc->status;
            });

            // 6. Ambil Data Sesi Pengiriman Aktual & Checkpoints (Single Source of Truth)
            $shippingSession = \App\Models\ShippingSession::where('assignment_no', $assignmentRef)
                ->with([
                    'sessionCheckpoints' => function ($q) {
                        $q->with([
                            'checkpoint',
                            'picUser:id,name',
                            'reports' => function ($rq) {
                                $rq->with(['photos', 'createdBy:id,name'])->latest('event_at');
                            },
                        ]);
                    },
                    'currentCheckpoint:id,name',
                ])
                ->first();

            // Tentukan status shipment secara akurat
            if ($shippingSession) {
                $rawSessionStatus = is_object($shippingSession->status) ? ($shippingSession->status->value ?? (string) $shippingSession->status) : (string) $shippingSession->status;
                $status = match (strtolower($rawSessionStatus)) {
                    'delivered', 'completed' => 'Delivered',
                    'in_transit', 'in_progress' => 'In Transit',
                    'pending' => 'Pending',
                    'cancelled' => 'Cancelled',
                    default => ucfirst($rawSessionStatus),
                };
                if ($shippingSession->origin && $origin === '-') {
                    $origin = $shippingSession->origin;
                }
                if ($shippingSession->destination && $destination === '-') {
                    $destination = $shippingSession->destination;
                }
                if ($shippingSession->cargo_name && $itemName === ('Kargo ' . $assignmentRef)) {
                    $itemName = $shippingSession->cargo_name;
                }
            } else {
                // Sesi belum dibuat karena berkas masih dalam proses verifikasi
                $status = match (true) {
                    $statuses->contains(DocumentStatus::REJECTED->value) => 'Cancelled',
                    $statuses->contains(DocumentStatus::PENDING->value)  => 'Pending',
                    $statuses->every(fn ($s) => $s === DocumentStatus::VERIFIED->value) => 'In Transit',
                    default => 'Pending',
                };
            }

            // 7. Dokumen Lampiran
            $documentItems = $docs->map(function ($doc) {
                $rawStatus = $doc->status instanceof DocumentStatus ? $doc->status->value : (string) $doc->status;
                $statusLabel = match ($rawStatus) {
                    'VERIFIED' => 'Approved',
                    'REJECTED' => 'Rejected',
                    'PENDING'  => 'Pending Verification',
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

            $masterCheckpoints = \App\Models\Checkpoint::orderBy('sequence', 'asc')->get();

            $checkpointsList = [];
            $activitiesList = [];
            $completedCount = 0;
            $totalCount = $masterCheckpoints->count() > 0 ? $masterCheckpoints->count() : 4;
            $currentCheckpointName = $origin !== '-' ? $origin : 'Pelabuhan Asal';

            if ($shippingSession) {
                $sessionCheckpointsByKey = $shippingSession->sessionCheckpoints->keyBy('checkpoint_id');
                $currentCheckpointName = $shippingSession->currentCheckpoint?->name ?? ($origin !== '-' ? $origin : 'Pelabuhan Asal');

                foreach ($masterCheckpoints as $mcp) {
                    $sc = $sessionCheckpointsByKey->get($mcp->id);
                    $rawStatus = $sc ? (is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status) : 'pending';
                    $statusUpper = strtoupper($rawStatus);

                    $nodeStatus = match ($statusUpper) {
                        'COMPLETED', 'SELESAI' => 'completed',
                        'IN_PROGRESS', 'AKTIF' => 'current',
                        default => 'pending',
                    };

                    if ($nodeStatus === 'completed') {
                        $completedCount++;
                    }

                    $latestReport = $sc?->reports?->first();
                    $dateStr = $sc?->actual_finish?->format('d M Y')
                        ?? $sc?->actual_start?->format('d M Y')
                        ?? $latestReport?->event_at?->format('d M Y');

                    $timeStr = $sc?->actual_finish?->format('H:i')
                        ?? $sc?->actual_start?->format('H:i')
                        ?? $latestReport?->event_at?->format('H:i');

                    $notes = null;
                    if ($nodeStatus === 'completed') {
                        $notes = 'Tahap selesai' . ($sc?->picUser ? ' (PIC: ' . $sc->picUser->name . ')' : '');
                    } elseif ($nodeStatus === 'current') {
                        $notes = 'Sedang berlangsung' . ($sc?->picUser ? ' (PIC: ' . $sc->picUser->name . ')' : '');
                    } else {
                        $notes = $sc?->picUser ? 'Ditugaskan ke ' . $sc->picUser->name : 'Menunggu giliran tahap';
                    }

                    $checkpointsList[] = [
                        'id'     => 'cp-' . $mcp->id,
                        'name'   => $mcp->name,
                        'status' => $nodeStatus,
                        'date'   => $dateStr,
                        'time'   => $timeStr,
                        'notes'  => $notes,
                    ];

                    // Tambahkan event aktivitas jika ada report
                    if ($latestReport) {
                        $activitiesList[] = [
                            'id'    => 'act-rep-' . $latestReport->id,
                            'time'  => $latestReport->event_at ? $latestReport->event_at->format('H:i') : ($timeStr ?? '00:00'),
                            'date'  => $latestReport->event_at ? $latestReport->event_at->format('d M Y') : ($dateStr ?? $formattedDate),
                            'title' => 'Laporan ' . $mcp->name . ($latestReport->status === \App\Enums\ReportStatus::COMPLETED ? ' selesai' : ' diperbarui'),
                            'user'  => $latestReport->createdBy?->name ?? ($sc?->picUser?->name ?? 'Field Worker'),
                            'role'  => 'Field Worker',
                        ];
                    }
                }
            } else {
                // Sesi pengiriman belum dibuat (menunggu supervisor approve dokumen)
                foreach ($masterCheckpoints as $idx => $mcp) {
                    $checkpointsList[] = [
                        'id'     => 'cp-' . $mcp->id,
                        'name'   => $mcp->name,
                        'status' => 'pending',
                        'date'   => null,
                        'time'   => null,
                        'notes'  => $idx === 0 ? 'Menunggu verifikasi berkas oleh Supervisor' : 'Menunggu giliran tahap',
                    ];
                }
            }

            // Event Dokumen
            $activitiesList[] = [
                'id'    => 'act-doc-' . $assignmentRef,
                'time'  => $formattedTime,
                'date'  => $formattedDate,
                'title' => $status === 'In Transit'
                    ? 'Dokumen disetujui & sesi pengiriman aktif'
                    : ('Dokumen diajukan (' . $docs->count() . ' berkas)'),
                'user'  => $uploader?->name ?? 'Staff Operations',
                'role'  => 'Operations Staff',
            ];

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
                'currentCheckpoint'    => $currentCheckpointName,
                'totalCheckpoints'     => $totalCount,
                'completedCheckpoints' => $completedCount,
                'itemCode'             => $itemCode,
                'currentLocation'      => $currentCheckpointName,
                'totalWeight'          => $totalWeight,
                'model'                => $itemType,
                'manufacturer'         => $manufacturer,
                'finalDestination'     => $destination,
                'cargos'               => $cargos,
                'checkpoints'          => $checkpointsList,
                'documents'            => $documentItems,
                'reports'              => [],
                'photos'               => [],
                'activities'           => $activitiesList,
            ];
        })->values();
    }
}
