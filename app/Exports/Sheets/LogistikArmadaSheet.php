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
 * Sheet 3 — Logistik & Armada Multimodal (one row per session ×
 * transport stage: Kapal / Tongkang / Pelabuhan).
 *
 * Every cell is scoped to its own stage: the Kapal row shows
 * nama_mv/nama_tongkang/ciqp_status, the Tongkang row shows
 * dermaga_pelindo, the Pelabuhan row shows plat/supir. Columns
 * without data for that stage stay '-' (never backfilled across
 * stages, never fabricated).
 *
 * Tipe Armada is evidence-based only: fleet hints from linked
 * movement names (BG* → Tongkang, Trailer* → Truk, KM* → MV)
 * plus the stage's own key fields. No evidence → '-'.
 */
class LogistikArmadaSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    use ReportSheetStyle;

    /** @var list<string> */
    private const array TRANSPORT_STAGES = ['Kapal', 'Tongkang', 'Pelabuhan'];

    /**
     * @param array<string, mixed> $summary Tahap 1 generateSummary() output.
     */
    public function __construct(
        private readonly array $summary,
    ) {}

    public function title(): string
    {
        return 'Logistik & Armada Multimodal';
    }

    public function headings(): array
    {
        return [
            'No Sesi',
            'Tahapan',
            'Tipe Armada',
            'Nama MV',
            'Nama Tongkang',
            'Status CIQP',
            'Dermaga',
            'Plat Truk',
            'Nama Supir',
            'Tanggal Berangkat',
            'Tanggal Tiba',
            'PIC',
        ];
    }

    public function collection(): Collection
    {
        $rows = [];

        foreach ($this->summary['sessions'] as $session) {
            $stages = $session->sessionCheckpoints
                ->filter(fn ($sc) => in_array($sc->checkpoint?->name, self::TRANSPORT_STAGES, true))
                ->sortBy(fn ($sc) => $sc->checkpoint?->sequence ?? 999)
                ->values();

            if ($stages->isEmpty()) {
                $rows[] = $this->placeholderRow($session);
                continue;
            }

            foreach ($stages as $sc) {
                $rows[] = $this->stageRow($session, $sc);
            }
        }

        return collect($rows);
    }

    /** @param array<string, mixed> $row */
    public function map($row): array
    {
        return [
            $row['assignment_no'],
            $row['stage'],
            $row['fleet_type'],
            $row['nama_mv'],
            $row['nama_tongkang'],
            $row['ciqp_status'],
            $row['dermaga'],
            $row['license_plate'],
            $row['driver_name'],
            $row['departed_at'],
            $row['arrived_at'],
            $row['pic'],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return $this->headerStyles();
    }

    /**
     * @param mixed $session
     * @return array<string, string>
     */
    private function placeholderRow($session): array
    {
        return [
            'assignment_no' => (string) ($session->assignment_no ?? $session->id),
            'stage'         => '-',
            'fleet_type'    => '-',
            'nama_mv'       => '-',
            'nama_tongkang' => '-',
            'ciqp_status'   => '-',
            'dermaga'       => '-',
            'license_plate' => '-',
            'driver_name'   => '-',
            'departed_at'   => '-',
            'arrived_at'    => '-',
            'pic'           => '-',
        ];
    }

    /**
     * @param mixed $session
     * @param mixed $sc
     * @return array<string, string>
     */
    private function stageRow($session, $sc): array
    {
        $values = [];
        foreach ($sc->reports as $report) {
            foreach ($report->reportValues as $rv) {
                $key = $rv->templateField?->field_key;
                if ($key !== null && ! array_key_exists($key, $values) && $rv->value !== null && $rv->value !== '') {
                    $values[$key] = (string) $rv->value;
                }
            }
        }

        $movementNames = $sc->movements->map(fn ($m) => (string) $m->movement_name)->all();

        $cell = fn (?string $v) => ($v !== null && $v !== '') ? $v : '-';

        return [
            'assignment_no' => (string) ($session->assignment_no ?? $session->id),
            'stage'         => (string) ($sc->checkpoint?->name ?? '-'),
            'fleet_type'    => $this->fleetType($values, $movementNames),
            'nama_mv'       => $cell($values['nama_mv'] ?? null),
            'nama_tongkang' => $cell($values['nama_tongkang'] ?? null),
            'ciqp_status'   => isset($values['ciqp_status']) ? strtoupper($values['ciqp_status']) : '-',
            'dermaga'       => $cell($values['dermaga_pelindo'] ?? null),
            'license_plate' => $cell($values['license_plate'] ?? null),
            'driver_name'   => $cell($values['driver_name'] ?? null),
            'departed_at'   => $this->fmtDateTime($sc->actual_start),
            'arrived_at'    => $this->fmtDateTime($sc->actual_finish),
            'pic'           => $sc->picUser?->name ?? '-',
        ];
    }

    /**
     * @param array<string, string> $values stage report_values
     * @param list<string> $movementNames linked movement names
     */
    private function fleetType(array $values, array $movementNames): string
    {
        $types = [];

        $hasMv = isset($values['nama_mv']);
        $hasBarge = isset($values['nama_tongkang']);
        $hasTruckPlate = isset($values['license_plate']);

        foreach ($movementNames as $name) {
            if (str_starts_with(strtoupper(ltrim($name)), 'BG')) {
                $hasBarge = true;
            } elseif (str_contains(strtolower($name), 'trailer') || str_contains(strtolower($name), 'truk') || str_contains(strtolower($name), 'truck')) {
                $hasTruckPlate = true;
            } elseif (str_starts_with(strtoupper(ltrim($name)), 'KM')) {
                $hasMv = true;
            }
        }

        if ($hasMv) {
            $types[] = 'Kapal (MV)';
        }
        if ($hasBarge) {
            $types[] = 'Tongkang';
        }
        if ($hasTruckPlate) {
            $types[] = 'Truk';
        }

        return $types === [] ? '-' : implode('; ', $types);
    }
}
