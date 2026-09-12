<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use App\Exports\Sheets\Concerns\ReportSheetStyle;
use App\Models\TemplateField;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet 5 — Bukti Penerimaan Site / POD (one row per session).
 *
 * - Tanggal Tiba: Site actual_finish, fallback to latest Site
 *   report event_at, else '-'.
 * - Nama Penerima / Kondisi Kargo: Site report_values
 *   (nama_penerima_site / kondisi_barang), else '-'.
 * - Keterangan BAST: latest Site report description as stored.
 * - Status Surat Jalan: 'Terlampir' only when a Site report photo
 *   exists on the foto_surat_jalan_ttd_cap slot, else
 *   'Belum terlampir'. Single template-field lookup, no N+1.
 */
class BuktiPodSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
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
        // NOTE: Excel forbids '/' in sheet titles — the plan's
        // 'Bukti Penerimaan Site / POD' is rendered with a dash.
        return 'Bukti Penerimaan Site - POD';
    }

    public function headings(): array
    {
        return [
            'No Sesi',
            'Customer',
            'Tanggal Tiba',
            'Nama Penerima',
            'Kondisi Kargo',
            'Keterangan BAST',
            'Status Surat Jalan',
        ];
    }

    public function collection(): Collection
    {
        $bastPhotoFieldId = TemplateField::where('field_key', 'foto_surat_jalan_ttd_cap')->value('id');

        return $this->summary['sessions']->map(function ($session) use ($bastPhotoFieldId) {
            $siteStages = $session->sessionCheckpoints
                ->filter(fn ($sc) => ($sc->checkpoint?->name ?? '') === 'Site')
                ->values();

            $site = $siteStages->first();

            $reports = $site?->reports
                ->sortByDesc(fn ($r) => ($r->event_at ?? $r->created_at)?->timestamp ?? 0)
                ->values() ?? collect();

            $values = [];
            $hasBastPhoto = false;
            foreach ($reports as $report) {
                foreach ($report->reportValues as $rv) {
                    $key = $rv->templateField?->field_key;
                    if ($key !== null && ! array_key_exists($key, $values) && $rv->value !== null && $rv->value !== '') {
                        $values[$key] = (string) $rv->value;
                    }
                }
                if ($bastPhotoFieldId !== null && ! $hasBastPhoto) {
                    $hasBastPhoto = $report->photos->contains(fn ($p) => (string) $p->template_field_id === (string) $bastPhotoFieldId);
                }
            }

            $latestReport = $reports->first();
            $arrivedAt = $site?->actual_finish
                ?? $latestReport?->event_at
                ?? $latestReport?->created_at;

            $cell = fn (?string $v) => ($v !== null && $v !== '') ? $v : '-';

            return [
                'assignment_no' => (string) ($session->assignment_no ?? $session->id),
                'customer'      => $session->customer?->company_name ?? '-',
                'arrived_at'    => $this->fmtDateTime($arrivedAt),
                'receiver'      => $cell($values['nama_penerima_site'] ?? null),
                'condition'     => $cell($values['kondisi_barang'] ?? null),
                'bast_note'     => $cell($latestReport?->description),
                'do_status'     => $hasBastPhoto ? 'Terlampir' : 'Belum terlampir',
            ];
        });
    }

    /** @param array<string, mixed> $row */
    public function map($row): array
    {
        return [
            $row['assignment_no'],
            $row['customer'],
            $row['arrived_at'],
            $row['receiver'],
            $row['condition'],
            $row['bast_note'],
            $row['do_status'],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return $this->headerStyles();
    }
}
