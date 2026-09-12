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
 * Sheet 4 — Audit Dokumen & Pabean (one row per session).
 *
 * Verification rollup comes from the Tahap 1 document_compliance
 * rows; document numbers and monetary figures are read raw from
 * documents.document_data (no parsing — strings shown as stored).
 */
class AuditDokumenSheet implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
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
        return 'Audit Dokumen & Pabean';
    }

    public function headings(): array
    {
        return [
            'No Sesi',
            'No B/L',
            'No CI',
            'Nilai Invoice',
            'No PL',
            'No Polis Asuransi',
            'Nilai Pertanggungan',
            'Status Verifikasi',
            'Diverifikasi Oleh',
            'Verifikasi Terakhir',
        ];
    }

    public function collection(): Collection
    {
        $sessionsById = $this->summary['sessions']->keyBy(fn ($s) => (string) $s->id);

        return collect($this->summary['document_compliance'])->map(function (array $entry) use ($sessionsById) {
            $session = $sessionsById->get($entry['session_id']);
            $dataByType = $this->documentDataByType($session);

            $bl = $dataByType['bill of lading'] ?? [];
            $ci = $dataByType['commercial invoice'] ?? [];
            $pl = $dataByType['packing list'] ?? [];
            $ins = $dataByType['insurance'] ?? [];

            $entry['bl_number'] = $bl['document_number'] ?? '-';
            $entry['ci_number'] = $ci['document_number'] ?? '-';
            $entry['ci_amount'] = isset($ci['total_amount']) && $ci['total_amount'] !== '' ? (string) $ci['total_amount'] : '-';
            $entry['pl_number'] = $pl['document_number'] ?? '-';
            $entry['ins_number'] = $ins['document_number'] ?? '-';
            $entry['ins_amount'] = isset($ins['sum_insured']) && $ins['sum_insured'] !== '' ? (string) $ins['sum_insured'] : '-';
            $entry['status_label'] = $this->verificationStatus($entry);
            $entry['verifiers_label'] = $this->verifiers($entry);
            $entry['last_verified_label'] = $this->lastVerified($entry);

            return $entry;
        });
    }

    /** @param array<string, mixed> $row */
    public function map($row): array
    {
        return [
            $row['assignment_no'] ?? '-',
            $row['bl_number'],
            $row['ci_number'],
            $row['ci_amount'],
            $row['pl_number'],
            $row['ins_number'],
            $row['ins_amount'],
            $row['status_label'],
            $row['verifiers_label'],
            $row['last_verified_label'],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return $this->headerStyles();
    }

    /**
     * Raw document_data keyed by lowercase document type name.
     *
     * @return array<string, array<string, mixed>>
     */
    private function documentDataByType(mixed $session): array
    {
        $result = [];
        if ($session === null) {
            return $result;
        }

        foreach ($session->documents as $doc) {
            $key = strtolower((string) ($doc->documentType?->name ?? ''));
            if ($key === '' || isset($result[$key])) {
                continue;
            }
            $result[$key] = is_array($doc->document_data) ? $doc->document_data : [];
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function verificationStatus(array $entry): string
    {
        if ($entry['complete']) {
            return "Lengkap ({$entry['verified']}/{$entry['required']} terverifikasi)";
        }

        $label = "Belum lengkap ({$entry['verified']}/{$entry['required']})";

        $rejectedTypes = array_column($entry['rejected'], 'document_type');
        if ($rejectedTypes !== []) {
            $label .= ' — Ditolak: '.implode(', ', $rejectedTypes);
        }

        return $label;
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function verifiers(array $entry): string
    {
        $names = [];
        foreach ($entry['types'] as $info) {
            if (($info['present'] ?? false) && ! empty($info['verified_by'])) {
                $names[$info['verified_by']] = true;
            }
        }

        return $names === [] ? '-' : implode('; ', array_keys($names));
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function lastVerified(array $entry): string
    {
        $latest = null;
        foreach ($entry['types'] as $info) {
            if (! empty($info['verified_at']) && ($latest === null || $info['verified_at'] > $latest)) {
                $latest = $info['verified_at'];
            }
        }

        return $this->fmtDateTime($latest);
    }
}
