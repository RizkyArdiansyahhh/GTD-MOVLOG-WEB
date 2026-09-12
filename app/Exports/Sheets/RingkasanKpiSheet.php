<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use App\Exports\Sheets\Concerns\ReportSheetStyle;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet 1 — Ringkasan & KPI.
 *
 * Label/value rows grouped by section, sourced entirely from the
 * Tahap 1 ReportService summary (kpi, stage_durations,
 * status/checkpoint breakdowns, customer_insights).
 */
class RingkasanKpiSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    use ReportSheetStyle;

    /**
     * @param array<string, mixed> $summary Tahap 1 generateSummary() output.
     */
    public function __construct(
        private readonly array $summary,
    ) {}

    public function title(): string
    {
        return 'Ringkasan & KPI';
    }

    public function headings(): array
    {
        return ['Bagian', 'Indikator', 'Nilai'];
    }

    public function collection(): Collection
    {
        $rows = [];
        $kpi = $this->summary['kpi'];

        $rows[] = ['Operasional', 'Total sesi pengiriman', $this->summary['total_sessions']];
        $rows[] = ['Operasional', 'Total unit barang (session_units)', $kpi['total_units']];
        $rows[] = ['Operasional', 'Sesi telah tiba di tujuan', $this->summary['delivered_count']];
        $rows[] = ['Operasional', 'Sesi sedang dalam perjalanan', $this->summary['in_transit_count']];

        foreach ($this->summary['status_breakdown'] as $status => $count) {
            $rows[] = ['Operasional', 'Status: '.$this->sessionStatusLabel((string) $status), $count];
        }
        foreach ($this->summary['checkpoint_breakdown'] as $stage => $count) {
            $rows[] = ['Operasional', 'Sesi aktif tahap '.$stage, $count];
        }

        $rows[] = ['Tonase & Nilai Komersial', 'Total gross weight', $kpi['gross_weight_label']];
        $rows[] = ['Tonase & Nilai Komersial', 'Total net weight', $kpi['net_weight_label']];
        $rows[] = ['Tonase & Nilai Komersial', 'Sesi berkontribusi tonase', $kpi['weight_sessions']];
        $rows[] = ['Tonase & Nilai Komersial', 'Total nilai komersial', $kpi['commercial_value_label']];
        $rows[] = ['Tonase & Nilai Komersial', 'Sesi berkontribusi nilai', $kpi['commercial_sessions']];

        $rows[] = [
            'Lead Time & Tahapan',
            'Rata-rata lead time (sesi selesai)',
            $kpi['avg_lead_time_days'] !== null ? $kpi['avg_lead_time_days'].' hari' : '-',
        ];
        $rows[] = ['Lead Time & Tahapan', 'Sesi selesai terukur', $kpi['completed_lead_time_count']];
        foreach ($this->summary['stage_durations'] as $stage => $stat) {
            $rows[] = [
                'Lead Time & Tahapan',
                "Rata-rata tahap {$stage} ({$stat['samples']} sampel)",
                $stat['avg_days'].' hari',
            ];
        }
        $rows[] = ['Lead Time & Tahapan', 'Bottleneck (tahap terlama)', $kpi['bottleneck_stage'] ?? '-'];

        if ($kpi['ciqp_breakdown'] === []) {
            $rows[] = ['CIQP Laut', 'Status CIQP tercatat', '-'];
        } else {
            foreach ($kpi['ciqp_breakdown'] as $status => $count) {
                $rows[] = ['CIQP Laut', 'CIQP '.$status, $count];
            }
        }

        if ($this->summary['customer_insights'] === []) {
            $rows[] = ['Per Customer', 'Customer tercatat', '-'];
        } else {
            foreach ($this->summary['customer_insights'] as $insight) {
                $rows[] = [
                    'Per Customer',
                    "{$insight['company_name']} — {$insight['total_sessions']} sesi "
                    ."(selesai {$insight['delivered']}, rasio ".number_format($insight['delivered_ratio'] * 100, 1, ',', '.').'%)',
                    $insight['avg_lead_time_days'] !== null ? $insight['avg_lead_time_days'].' hari rata-rata' : 'belum ada sesi selesai',
                ];
            }
        }

        return collect($rows);
    }

    /** @param array<int, mixed> $row */
    public function map($row): array
    {
        return [$row[0], $row[1], $row[2]];
    }

    public function styles(Worksheet $sheet): array
    {
        return $this->headerStyles();
    }
}
