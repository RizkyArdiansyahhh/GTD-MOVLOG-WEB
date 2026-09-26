<?php

declare(strict_types=1);

namespace App\Support;

use Carbon\Carbon;

/**
 * Narrative helpers for the executive PDF dossier (Tahap 3).
 *
 * Pure presentation over already-loaded relations — no queries here
 * except none at all; callers resolve the BAST photo field id once
 * and pass it in. Missing data yields null/'-' and is never
 * fabricated.
 */
class ReportNarrative
{
    /**
     * Indonesian duration between two moments: "45 menit",
     * "24 jam", "1 hari 4 jam".
     */
    public static function durasi(?Carbon $start, ?Carbon $finish): ?string
    {
        if ($start === null || $finish === null) {
            return null;
        }

        $minutes = (int) $start->diffInMinutes($finish);
        if ($minutes < 60) {
            return $minutes.' menit';
        }

        $hours = intdiv($minutes, 60);
        $restMinutes = $minutes % 60;
        if ($hours < 48) {
            return $restMinutes > 0 ? "{$hours} jam {$restMinutes} menit" : "{$hours} jam";
        }

        $days = intdiv($hours, 24);
        $restHours = $hours % 24;

        return $restHours > 0 ? "{$days} hari {$restHours} jam" : "{$days} hari";
    }

    /**
     * Flatten a session's report_values to field_key => value.
     * Latest report (event_at, fallback created_at) wins per key.
     *
     * @param mixed $session ShippingSession with loaded relations
     * @return array<string, string>
     */
    public static function sessionFieldValues($session): array
    {
        $reports = collect();
        foreach ($session->sessionCheckpoints as $sc) {
            foreach ($sc->reports as $report) {
                $reports->push($report);
            }
        }

        $reports = $reports->sortByDesc(
            fn ($r) => ($r->event_at ?? $r->created_at)?->timestamp ?? 0
        )->values();

        $values = [];
        foreach ($reports as $report) {
            foreach ($report->reportValues as $rv) {
                $key = $rv->templateField?->field_key;
                if ($key !== null && ! array_key_exists($key, $values) && $rv->value !== null && $rv->value !== '') {
                    $values[$key] = (string) $rv->value;
                }
            }
        }

        return $values;
    }

    /**
     * Site / POD proof bundle for one session.
     *
     * @param mixed $session ShippingSession with loaded relations
     * @return array{
     *   has_site: bool,
     *   arrived_at: ?Carbon,
     *   receiver: ?string,
     *   condition: ?string,
     *   bast_note: ?string,
     *   has_bast_photo: bool,
     * }
     */
    public static function podInfo($session, mixed $bastPhotoFieldId = null): array
    {
        $site = $session->sessionCheckpoints
            ->first(fn ($sc) => ($sc->checkpoint?->name ?? '') === 'Site');

        $empty = [
            'has_site'       => $site !== null,
            'arrived_at'     => null,
            'receiver'       => null,
            'condition'      => null,
            'bast_note'      => null,
            'has_bast_photo' => false,
        ];

        if ($site === null) {
            return $empty;
        }

        $reports = $site->reports
            ->sortByDesc(fn ($r) => ($r->event_at ?? $r->created_at)?->timestamp ?? 0)
            ->values();

        $values = [];
        $hasBastPhoto = false;
        foreach ($reports as $report) {
            foreach ($report->reportValues as $rv) {
                $key = $rv->templateField?->field_key;
                if ($key !== null && ! array_key_exists($key, $values) && $rv->value !== null && $rv->value !== '') {
                    $values[$key] = (string) $rv->value;
                }
            }
            if (! $hasBastPhoto && $bastPhotoFieldId !== null) {
                $hasBastPhoto = $report->photos->contains(
                    fn ($p) => (string) $p->template_field_id === (string) $bastPhotoFieldId
                );
            }
        }

        $latest = $reports->first();
        $note = $latest?->description;
        if ($note !== null && trim($note) === '') {
            $note = null;
        }

        return [
            'has_site'       => true,
            'arrived_at'     => $site->actual_finish ?? $latest?->event_at ?? $latest?->created_at,
            'receiver'       => $values['nama_penerima_site'] ?? null,
            'condition'      => $values['kondisi_barang'] ?? null,
            'bast_note'      => $note,
            'has_bast_photo' => $hasBastPhoto,
        ];
    }

    /**
     * Whether the POD block is worth rendering (any real signal).
     *
     * @param array{arrived_at: ?Carbon, receiver: ?string, condition: ?string, bast_note: ?string, has_bast_photo: bool, has_site: bool} $pod
     */
    public static function hasPodSignal(array $pod): bool
    {
        return $pod['arrived_at'] !== null
            || $pod['receiver'] !== null
            || $pod['condition'] !== null
            || $pod['bast_note'] !== null
            || $pod['has_bast_photo'];
    }
}
