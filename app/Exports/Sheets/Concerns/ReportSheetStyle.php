<?php

declare(strict_types=1);

namespace App\Exports\Sheets\Concerns;

use App\Enums\ShippingSessionStatus;
use Carbon\Carbon;

/**
 * Shared presentation helpers for the Laporan workbook sheets.
 *
 * Formatting only — every value shown originates from real loaded
 * data (Tahap 1 summary); missing data renders as '-' and is never
 * fabricated.
 */
trait ReportSheetStyle
{
    /**
     * Header row style (slate header, bold white text) — same look
     * as the legacy single-table export.
     *
     * @return array<int, array<string, mixed>>
     */
    public function headerStyles(): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF0F172A']],
                'alignment' => ['horizontal' => 'left'],
            ],
        ];
    }

    private function fmtDateTime(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        try {
            return Carbon::parse($value)->format('d/m/Y H:i');
        } catch (\Throwable) {
            return '-';
        }
    }

    private function sessionStatusLabel(string $status): string
    {
        return ShippingSessionStatus::tryFrom(strtolower($status))?->label() ?? strtolower($status);
    }

    private function formatKgCell(?float $kg): string
    {
        if ($kg === null) {
            return '-';
        }
        $decimals = abs($kg - round($kg)) < 0.005 ? 0 : 1;

        return number_format($kg, $decimals, ',', '.').' KG';
    }
}
