<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>GTD Logistics - Laporan Pengiriman</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 2.2cm 2cm;
        }

        * {
            box-sizing: border-box;
        }

        li {
            margin-bottom: 4px;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #1E293B;
            font-size: 10px;
            line-height: 1.5;
            background: #fff;
        }

        /* Header */
        .report-header {
            border-bottom: 2px solid #0F172A;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .header-title {
            font-size: 18px;
            color: #0F172A;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .header-meta {
            font-size: 9px;
            color: #94A3B8;
            margin-bottom: 3px;
        }

        /* Summary paragraph */
        .summary-paragraph {
            font-size: 10px;
            color: #1E293B;
            margin-bottom: 20px;
            line-height: 1.7;
            text-align: justify;
        }

        /* Executive dashboard (page 1 only — the sole tabular area) */
        .dash-heading {
            font-size: 11px;
            font-weight: bold;
            color: #0F172A;
            margin: 14px 0 6px 0;
        }
        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9.5px;
        }
        .kpi-table th,
        .kpi-table td {
            border: 0.5px solid #CBD5E1;
            padding: 4px 8px;
            text-align: left;
        }
        .kpi-table th {
            background: #F1F5F9;
            color: #0F172A;
        }
        .dash-note {
            font-size: 9.5px;
            color: #64748B;
            font-style: italic;
            margin-bottom: 10px;
        }
        .page-break {
            page-break-after: always;
        }

        /* Per-session block */
        .session-block {
            margin-bottom: 18px;
            padding-bottom: 16px;
            border-bottom: 0.5px solid #E2E8F0;
        }
        .session-title {
            font-size: 12px;
            font-weight: bold;
            color: #0F172A;
            margin-bottom: 3px;
        }
        .session-meta {
            font-size: 9px;
            color: #64748B;
            margin-bottom: 8px;
        }
        .session-status {
            font-size: 10px;
            color: #1E293B;
            margin-bottom: 10px;
            text-align: justify;
        }

        /* Movement history */
        .riwayat-label {
            font-size: 8.5px;
            font-weight: bold;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 5px;
        }
        .history-list {
            margin: 0 0 6px 0;
            padding: 0 0 0 16px;
        }
        .riwayat-item {
            font-size: 9px;
            color: #1E293B;
            margin-bottom: 4px !important;
        }

        /* Narrative enrichment blocks (paragraphs, never tables) */
        .enrichment {
            font-size: 9.5px;
            color: #1E293B;
            margin: 8px 0 6px 0;
            line-height: 1.6;
            text-align: justify;
        }

        .empty-note {
            font-size: 10px;
            color: #64748B;
            font-style: italic;
        }
    </style>
</head>
<body>

{{-- Header: judul + periode + meta --}}
<div class="report-header">
    <div class="header-title">GTD Logistics &mdash; Laporan Pengiriman</div>
    <div class="header-meta">
        Periode: {{ \Carbon\Carbon::parse($data['period']['start'])->format('d/m/Y') }}
        &ndash; {{ \Carbon\Carbon::parse($data['period']['end'])->format('d/m/Y') }}
    </div>
    <div class="header-meta">
        Dibuat: {{ $data['generated_at'] }} &nbsp;|&nbsp; Admin: {{ $data['generated_by'] }} &nbsp;|&nbsp; Total sesi: {{ $data['total_sessions'] }}
    </div>
</div>

{{-- Paragraf ringkasan (kalimat, bukan angka kotak) --}}
<div class="summary-paragraph">
    {{ $data['operational_narrative'] ?? $data['operational_summary'] ?? '' }}
</div>

{{-- Halaman 1 — Executive Dashboard (satu-satunya area bertabel) --}}
@if (!empty($data['kpi']))
    @php
        $kpi = $data['kpi'];
        $stageDurations = $data['stage_durations'] ?? [];
        $customerInsights = $data['customer_insights'] ?? [];
        $qty = $kpi['total_quantity'] ?? null;
        $qtyLabel = $qty === null ? '-' : rtrim(rtrim(number_format((float) $qty, 2, ',', '.'), '0'), ',');
        $avgLead = $kpi['avg_lead_time_days'] ?? null;
        $avgLeadLabel = $avgLead !== null
            ? number_format((float) $avgLead, 1, ',', '.').' hari ('.($kpi['completed_lead_time_count'] ?? 0).' sesi selesai terukur)'
            : '-';
    @endphp
    <div id="executive-dashboard">
        <div class="dash-heading">Dashboard Eksekutif</div>
        <table class="kpi-table">
            <tr><th style="width: 45%;">Indikator</th><th>Nilai</th></tr>
            <tr><td>Total sesi pengiriman</td><td>{{ $data['total_sessions'] }}</td></tr>
            <tr><td>Total unit barang</td><td>{{ $kpi['total_units'] }}</td></tr>
            <tr><td>Total kuantitas kargo</td><td>{{ $qtyLabel }}</td></tr>
            <tr><td>Total gross weight</td><td>{{ $kpi['gross_weight_label'] }} ({{ $kpi['weight_sessions'] }} sesi berkontribusi)</td></tr>
            <tr><td>Total net weight</td><td>{{ $kpi['net_weight_label'] }}</td></tr>
            <tr><td>Total nilai komersial</td><td>{{ $kpi['commercial_value_label'] }} ({{ $kpi['commercial_sessions'] }} sesi berkontribusi)</td></tr>
            <tr><td>Rata-rata lead time</td><td>{{ $avgLeadLabel }}</td></tr>
            <tr><td>Bottleneck (tahap terlama)</td><td>{{ $kpi['bottleneck_stage'] ?? '-' }}</td></tr>
        </table>

        <div class="dash-heading">Rata-Rata Durasi Per Tahap</div>
        @if (!empty($stageDurations))
            <table class="kpi-table">
                <tr><th>Tahap</th><th>Rata-rata</th><th>Sampel</th></tr>
                @foreach ($stageDurations as $stageName => $stat)
                    <tr>
                        <td>{{ $stageName }}</td>
                        <td>{{ number_format((float) $stat['avg_days'], 1, ',', '.') }} hari ({{ number_format((float) $stat['avg_hours'], 1, ',', '.') }} jam)</td>
                        <td>{{ $stat['samples'] }} sesi</td>
                    </tr>
                @endforeach
            </table>
        @else
            <div class="dash-note">Belum ada tahap yang selesai pada periode ini sehingga rata-rata durasi belum dapat dihitung.</div>
        @endif

        <div class="dash-heading">Status CIQP Laut</div>
        @if (!empty($kpi['ciqp_breakdown']))
            <table class="kpi-table">
                <tr><th>Status</th><th>Jumlah Sesi</th></tr>
                @foreach ($kpi['ciqp_breakdown'] as $ciqpStatus => $ciqpCount)
                    <tr><td>{{ $ciqpStatus }}</td><td>{{ $ciqpCount }}</td></tr>
                @endforeach
            </table>
        @else
            <div class="dash-note">Belum ada status CIQP yang tercatat pada periode ini.</div>
        @endif

        <div class="dash-heading">Performa Per Customer</div>
        @if (!empty($customerInsights))
            <table class="kpi-table">
                <tr><th>Customer</th><th>Sesi</th><th>Selesai</th><th>Rasio</th><th>Rata-rata Lead Time</th></tr>
                @foreach ($customerInsights as $insight)
                    <tr>
                        <td>{{ $insight['company_name'] }}</td>
                        <td>{{ $insight['total_sessions'] }}</td>
                        <td>{{ $insight['delivered'] }}</td>
                        <td>{{ number_format($insight['delivered_ratio'] * 100, 1, ',', '.') }}%</td>
                        <td>{{ $insight['avg_lead_time_days'] !== null ? number_format((float) $insight['avg_lead_time_days'], 1, ',', '.').' hari' : '-' }}</td>
                    </tr>
                @endforeach
            </table>
        @else
            <div class="dash-note">Belum ada data customer pada periode ini.</div>
        @endif
    </div>

    @if ($data['sessions']->isNotEmpty())
        <div class="page-break"></div>
    @endif
@endif

{{-- Loop per sesi: naratif + riwayat pergerakan + transshipment + POD --}}
@if ($data['sessions']->isNotEmpty())
    @php
        $bastFieldId = \App\Models\TemplateField::where('field_key', 'foto_surat_jalan_ttd_cap')->value('id');
    @endphp
    @foreach ($data['sessions'] as $session)
        @php
            $sessionStatusLabel = $session->status instanceof \App\Enums\ShippingSessionStatus
                ? $session->status->label()
                : strtolower((string) (is_object($session->status) ? ($session->status->value ?? (string) $session->status) : (string) $session->status));
            $currentName = $session->currentCheckpoint?->name ?? '-';
            $orderedCheckpoints = $session->sessionCheckpoints
                ->sortBy(fn ($sc) => $sc->checkpoint?->sequence ?? 999)
                ->values();
            $fieldValues = \App\Support\ReportNarrative::sessionFieldValues($session);
            $pod = \App\Support\ReportNarrative::podInfo($session, $bastFieldId ?? null);

            $transSentences = [];
            if (!empty($fieldValues['nama_mv']) || !empty($fieldValues['nama_tongkang'])) {
                if (!empty($fieldValues['nama_mv']) && !empty($fieldValues['nama_tongkang'])) {
                    $transSentences[] = 'Bongkar muat kapal ke tongkang (STS) dari MV '.$fieldValues['nama_mv'].' ke '.$fieldValues['nama_tongkang'].'.';
                } elseif (!empty($fieldValues['nama_mv'])) {
                    $transSentences[] = 'Mother vessel yang digunakan adalah MV '.$fieldValues['nama_mv'].'.';
                } else {
                    $transSentences[] = 'Tongkang yang digunakan adalah '.$fieldValues['nama_tongkang'].'.';
                }
            }
            if (!empty($fieldValues['ciqp_status'])) {
                $transSentences[] = 'Status CIQP pelayaran: '.strtoupper($fieldValues['ciqp_status']).'.';
            }
            if (!empty($fieldValues['dermaga_pelindo'])) {
                $sandaran = 'Tongkang bersandar di '.$fieldValues['dermaga_pelindo'];
                if (!empty($fieldValues['waktu_sandar'])) {
                    try {
                        $sandaran .= ' pada '.\Carbon\Carbon::parse($fieldValues['waktu_sandar'])->format('d/m/Y H:i');
                    } catch (\Throwable) {
                        $sandaran .= ' pada '.$fieldValues['waktu_sandar'];
                    }
                }
                $transSentences[] = $sandaran.'.';
            }
            if (!empty($fieldValues['license_plate']) || !empty($fieldValues['driver_name'])) {
                if (!empty($fieldValues['license_plate']) && !empty($fieldValues['driver_name'])) {
                    $transSentences[] = 'Angkutan darat menggunakan truk '.$fieldValues['license_plate'].' dengan supir '.$fieldValues['driver_name'].'.';
                } elseif (!empty($fieldValues['license_plate'])) {
                    $transSentences[] = 'Angkutan darat menggunakan truk '.$fieldValues['license_plate'].'.';
                } else {
                    $transSentences[] = 'Supir angkutan darat yang bertugas adalah '.$fieldValues['driver_name'].'.';
                }
            }
        @endphp
        <div class="session-block">
            <div class="session-title">{{ $session->assignment_no ?? (string) $session->id }} &mdash; {{ $session->customer?->company_name ?? '-' }}</div>
            <div class="session-meta">{{ $session->cargo_name ?? '-' }} &middot; {{ $session->total_quantity ?? 0 }} {{ $session->unit ?? 'unit' }} &middot; {{ $session->origin ?? '-' }} &rarr; {{ $session->destination ?? '-' }}</div>
            <div class="session-status">Sesi ini saat ini <strong>{{ $sessionStatusLabel }}</strong>, tahap terkini <strong>{{ $currentName }}</strong>.</div>

            @php
                $historyItems = $orderedCheckpoints->filter(fn ($sc) => !empty($sc->actual_start) || !empty($sc->actual_finish))->values();
            @endphp
            @if ($historyItems->isNotEmpty())
                <div class="riwayat-label">RIWAYAT PERGERAKAN</div>
                <ul class="history-list">
                    @foreach ($historyItems as $sc)
                        @php
                            $stageName = $sc->checkpoint?->name ?? '-';
                            $picName = $sc->picUser?->name ?? '-';
                            $stageStatusLabel = $sc->status instanceof \App\Enums\SessionCheckpointStatus
                                ? $sc->status->label()
                                : strtolower((string) (is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status));
                            $startFmt = !empty($sc->actual_start) ? \Carbon\Carbon::parse($sc->actual_start)->format('d/m/Y H:i') : null;
                            $finishFmt = !empty($sc->actual_finish) ? \Carbon\Carbon::parse($sc->actual_finish)->format('d/m/Y H:i') : null;
                            $durasi = \App\Support\ReportNarrative::durasi(
                                !empty($sc->actual_start) ? \Carbon\Carbon::parse($sc->actual_start) : null,
                                !empty($sc->actual_finish) ? \Carbon\Carbon::parse($sc->actual_finish) : null,
                            );
                            if ($finishFmt !== null) {
                                $timeline = $startFmt.' &rarr; '.$finishFmt.' ('.$durasi.')';
                            } elseif ($startFmt !== null) {
                                $ongoing = \App\Support\ReportNarrative::durasi(\Carbon\Carbon::parse($sc->actual_start), now());
                                $timeline = $startFmt.' &rarr; sekarang (berjalan '.$ongoing.')';
                            } else {
                                $timeline = '';
                            }
                        @endphp
                        <li class="riwayat-item">{!! $timeline !!} &mdash; Tahap {{ $stageName }} {{ $stageStatusLabel }} (PIC: {{ $picName }})</li>
                    @endforeach
                </ul>
            @endif

            @if (!empty($transSentences))
                <div class="riwayat-label">TRANSSHIPMENT &amp; ARMADA</div>
                <div class="enrichment">
                    @foreach ($transSentences as $sentence)
                        {{ $sentence }}
                    @endforeach
                </div>
            @endif

            @if (\App\Support\ReportNarrative::hasPodSignal($pod))
                <div class="riwayat-label">PENERIMAAN SITE (POD)</div>
                <div class="enrichment">
                    @if ($pod['arrived_at'] !== null)
                        Kargo tiba di site pada {{ \Carbon\Carbon::parse($pod['arrived_at'])->format('d/m/Y H:i') }}.
                    @endif
                    @if ($pod['receiver'] !== null)
                        Serah terima dilakukan kepada {{ $pod['receiver'] }}.
                    @endif
                    @if ($pod['condition'] !== null)
                        Kondisi kargo saat diterima: {{ $pod['condition'] }}.
                    @endif
                    @if ($pod['bast_note'] !== null)
                        Catatan serah terima: {{ $pod['bast_note'] }}
                    @endif
                    {{ $pod['has_bast_photo'] ? 'Surat jalan bertanda tangan dan cap telah terlampir pada laporan.' : 'Dokumentasi surat jalan bertanda tangan belum terlampir pada laporan.' }}
                </div>
            @endif
        </div>
    @endforeach
@else
    <div class="empty-note">Tidak terdapat data sesi pengiriman pada periode yang dipilih.</div>
@endif

</body>
</html>
