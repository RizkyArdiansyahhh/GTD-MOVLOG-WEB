<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet 2: Detail Sesi - Per-session tabular data.
 */
class DetailSheet implements FromCollection, WithTitle, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    private int $rowNumber = 0;

    public function __construct(
        private readonly Collection $sessions,
        private readonly array $period = [],
    ) {}

    public function title(): string
    {
        return 'Detail Sesi';
    }

    public function collection(): Collection
    {
        return $this->sessions;
    }

    public function headings(): array
    {
        return [
            'No',
            'No Sesi / Assignment',
            'Customer',
            'Nama Kargo',
            'Jumlah',
            'Satuan',
            'Rute Asal',
            'Rute Tujuan',
            'Status Sesi',
            'Tahap Terkini',
            'Tanggal Dibuat',
        ];
    }

    /** @param \App\Models\ShippingSession $session */
    public function map($session): array
    {
        $this->rowNumber++;

        $sessionStatus = is_object($session->status)
            ? ($session->status->value ?? (string) $session->status)
            : (string) $session->status;

        return [
            $this->rowNumber,
            $session->assignment_no ?? (string) $session->id,
            $session->customer?->company_name ?? '-',
            $session->cargo_name ?? '-',
            $session->total_quantity ?? 0,
            $session->unit ?? 'unit',
            $session->origin ?? '-',
            $session->destination ?? '-',
            strtoupper((string) $sessionStatus),
            $session->currentCheckpoint?->name ?? '-',
            $session->created_at?->format('Y-m-d H:i') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF0F172A']],
                'alignment' => ['horizontal' => 'left'],
            ],
        ];
    }
}
