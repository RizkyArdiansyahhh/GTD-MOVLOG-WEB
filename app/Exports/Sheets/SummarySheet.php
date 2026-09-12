<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet 1: Summary - Operational narrative, status breakdown, checkpoint breakdown.
 */
class SummarySheet implements FromArray, WithTitle, WithStyles, ShouldAutoSize
{
    public function __construct(
        private readonly array $summary,
    ) {}

    public function title(): string
    {
        return 'Summary';
    }

    public function array(): array
    {
        $rows = [];

        // Title
        $rows[] = ['GTD Logistics - Laporan Ringkasan Pengiriman'];
        $rows[] = [];

        // Period & Metadata
        $rows[] = ['Periode', ($this->summary['period']['start'] ?? '-') . ' sd ' . ($this->summary['period']['end'] ?? '-')];
        $rows[] = ['Dibuat', $this->summary['generated_at'] ?? now()->format('d/m/Y H:i')];
        $rows[] = ['Oleh', $this->summary['generated_by'] ?? 'System'];
        $rows[] = [];

        // Operational Narrative
        $rows[] = ['Ringkasan Operasional'];
        $rows[] = [$this->summary['operational_narrative'] ?? $this->summary['operational_summary'] ?? '-'];
        $rows[] = [];

        // Operational Highlights
        $rows[] = ['Highlight Operasional'];
        if (!empty($this->summary['operational_highlights'])) {
            foreach ($this->summary['operational_highlights'] as $item) {
                $rows[] = ['•', $item];
            }
        } else {
            $rows[] = ['-', 'Tidak terdapat catatan highlight operasional.'];
        }
        $rows[] = [];

        // Status Breakdown
        $rows[] = ['Ringkasan Status Sesi'];
        $rows[] = ['Status', 'Jumlah', 'Persentase'];

        $total = $this->summary['total_sessions'] ?? 0;
        if (!empty($this->summary['status_breakdown'])) {
            foreach ($this->summary['status_breakdown'] as $status => $count) {
                $pct = $total > 0 ? round(($count / $total) * 100, 1) : 0;
                $rows[] = [strtoupper((string) $status), $count, $pct . '%'];
            }
        }
        $rows[] = ['Total', $total, $total > 0 ? '100%' : '0%'];
        $rows[] = [];

        // Checkpoint Breakdown
        $rows[] = ['Distribusi Tahap Terkini'];
        $rows[] = ['Tahap', 'Jumlah Sesi'];
        if (!empty($this->summary['checkpoint_breakdown'])) {
            foreach ($this->summary['checkpoint_breakdown'] as $name => $count) {
                $rows[] = [$name, $count];
            }
        } else {
            $rows[] = ['-', 0];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
        ];
    }
}
