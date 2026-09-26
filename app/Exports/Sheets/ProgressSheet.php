<?php

declare(strict_types=1);

namespace App\Exports\Sheets;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet 3: Progress Tahap - Checkpoint progress per session.
 */
class ProgressSheet implements FromArray, WithTitle, WithStyles, ShouldAutoSize
{
    public function __construct(
        private readonly Collection $sessions,
    ) {}

    public function title(): string
    {
        return 'Progress Tahap';
    }

    public function array(): array
    {
        $rows = [];

        // Header row
        $rows[] = [
            'No Sesi / Assignment',
            'Tahap 1 (Kapal)',
            'Tahap 2 (Tongkang)',
            'Tahap 3 (Pelabuhan)',
            'Tahap 4 (Site)',
        ];

        $stageDefinitions = [
            ['name' => 'Kapal', 'seq' => 1],
            ['name' => 'Tongkang', 'seq' => 2],
            ['name' => 'Pelabuhan', 'seq' => 3],
            ['name' => 'Site', 'seq' => 4],
        ];

        foreach ($this->sessions as $session) {
            $row = [$session->assignment_no ?? (string) $session->id];

            foreach ($stageDefinitions as $stage) {
                $sc = $session->sessionCheckpoints->first(function ($item) use ($stage) {
                    return ($item->checkpoint?->sequence === $stage['seq'])
                        || (strcasecmp($item->checkpoint?->name ?? '', $stage['name']) === 0);
                });

                if (!$sc) {
                    $row[] = '-';
                    continue;
                }

                $statusStr = is_object($sc->status)
                    ? ($sc->status->value ?? (string) $sc->status)
                    : (string) $sc->status;

                $statusUp = strtoupper((string) $statusStr);
                $pic      = $sc->picUser?->name ?? null;

                $row[] = $statusUp === 'PENDING'
                    ? 'PENDING'
                    : $statusUp . ($pic ? ' (PIC: ' . $pic . ')' : '');
            }

            $rows[] = $row;
        }

        return $rows;
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
