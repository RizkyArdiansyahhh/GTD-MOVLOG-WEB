<?php

declare(strict_types=1);

namespace App\Exports;

use App\Exports\Sheets\AuditDokumenSheet;
use App\Exports\Sheets\BuktiPodSheet;
use App\Exports\Sheets\DataPengirimanSheet;
use App\Exports\Sheets\LogistikArmadaSheet;
use App\Exports\Sheets\RingkasanKpiSheet;
use App\Services\ReportService;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Enriched 5-sheet shipment report workbook (Tahap 2).
 *
 * All sheets share ONE Tahap 1 ReportService summary so KPI,
 * detail and audit rows are mutually consistent (and consistent
 * with the narrative PDF, which uses the same summary).
 *
 * Sheets:
 *  1. Ringkasan & KPI          — aggregates, lead times, CIQP, customers
 *  2. Data Pengiriman          — one row per session
 *  3. Logistik & Armada Multimodal — one row per session × transport stage
 *  4. Audit Dokumen & Pabean   — one row per session
 *  5. Bukti Penerimaan Site - POD  — one row per session
 *     ('/' is forbidden in Excel sheet titles, hence the dash)
 *
 * Constructor signature is unchanged from the legacy single-table
 * export so the controller call stays identical.
 */
class ShipmentReportExport implements Export, WithMultipleSheets
{
    public function __construct(
        private readonly string $startDate,
        private readonly string $endDate,
        private readonly ?string $customerId = null,
        private readonly ?string $status = null,
        private readonly ?string $search = null,
        private readonly string $sortBy = 'created_at',
        private readonly string $sortDirection = 'desc',
    ) {}

    /**
     * @return array<int, object>
     */
    public function sheets(): array
    {
        $summary = app(ReportService::class)->generateSummary([
            'start_date'     => $this->startDate,
            'end_date'       => $this->endDate,
            'customer_id'    => $this->customerId,
            'status'         => $this->status,
            'search'         => $this->search,
            'sort_by'        => $this->sortBy,
            'sort_direction' => $this->sortDirection,
        ]);

        return [
            new RingkasanKpiSheet($summary),
            new DataPengirimanSheet($summary),
            new LogistikArmadaSheet($summary),
            new AuditDokumenSheet($summary),
            new BuktiPodSheet($summary),
        ];
    }
}
