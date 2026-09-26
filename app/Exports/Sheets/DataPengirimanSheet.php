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
 * Sheet 2 — Data Pengiriman (one row per session).
 *
 * Weights / lead time come from the Tahap 1 sessions_detail rows.
 * Brand/type appends to the cargo name only when structured
 * document cargoDetail actually carries them (flat/legacy payloads
 * have neither — column then shows cargo_name alone, never invented).
 */
class DataPengirimanSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
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
        return 'Data Pengiriman';
    }

    public function headings(): array
    {
        return [
            'No Sesi',
            'Customer',
            'Kargo',
            'Qty',
            'Satuan',
            'Gross Weight',
            'Net Weight',
            'Asal',
            'Tujuan',
            'Status',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Lead Time (hari)',
        ];
    }

    public function collection(): Collection
    {
        $sessionsById = $this->summary['sessions']->keyBy(fn ($s) => (string) $s->id);

        return collect($this->summary['sessions_detail'])->map(function (array $detail) use ($sessionsById) {
            $session = $sessionsById->get($detail['id']);
            $detail['cargo_label'] = $this->cargoLabel($detail, $session);

            return $detail;
        });
    }

    /** @param array<string, mixed> $row */
    public function map($row): array
    {
        return [
            $row['assignment_no'] ?? '-',
            $row['customer_name'] ?? '-',
            $row['cargo_label'] ?? '-',
            $row['total_quantity'] ?? '-',
            $row['unit'] ?? '-',
            $this->formatKgCell($row['gross_weight_kg'] ?? null),
            $this->formatKgCell($row['net_weight_kg'] ?? null),
            $row['origin'] ?? '-',
            $row['destination'] ?? '-',
            $this->sessionStatusLabel((string) ($row['status'] ?? '')),
            $this->fmtDateTime($row['started_at'] ?? null),
            $this->fmtDateTime($row['finished_at'] ?? null),
            $row['lead_time_days'] ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return $this->headerStyles();
    }

    /**
     * Append brand/type to the cargo name only when structured
     * cargoDetail (CI → PL → BL) really contains them.
     *
     * @param array<string, mixed> $detail
     */
    private function cargoLabel(array $detail, mixed $session): string
    {
        $base = (string) ($detail['cargo_name'] ?? '-');
        $extras = $this->cargoExtras($session);

        if ($extras === []) {
            return $base;
        }

        return $base.' ('.implode(' / ', $extras).')';
    }

    /**
     * @return list<string>
     */
    private function cargoExtras(mixed $session): array
    {
        if ($session === null) {
            return [];
        }

        $docsByType = [];
        foreach ($session->documents as $doc) {
            $docsByType[strtolower((string) ($doc->documentType?->name ?? ''))][] = $doc;
        }

        $pick = function (string $needle) use ($docsByType): ?array {
            foreach ($docsByType as $type => $docs) {
                if (! str_contains($type, $needle)) {
                    continue;
                }
                foreach ($docs as $doc) {
                    $data = is_array($doc->document_data) ? $doc->document_data : [];
                    $items = $data['cargoDetail'] ?? null;
                    if (is_array($items) && isset($items[0]) && is_array($items[0])) {
                        return $items[0];
                    }
                }
            }

            return null;
        };

        $item = $pick('commercial invoice') ?? $pick('packing list') ?? $pick('bill of lading');
        if ($item === null) {
            return [];
        }

        $extras = [];
        foreach (['brand', 'type'] as $key) {
            $val = trim((string) ($item[$key] ?? ''));
            if ($val !== '' && $val !== '-') {
                $extras[] = $val;
            }
        }

        return $extras;
    }
}
