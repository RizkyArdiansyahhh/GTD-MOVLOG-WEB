<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Requests\Report\GenerateReportRequest;
use App\Repositories\Contracts\ShippingSessionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class ReportService
{
    public function __construct(
        private readonly ShippingSessionRepositoryInterface $shipmentRepository,
    ) {}

    /**
     * Aggregate all data needed for a report export or preview.
     *
     * status_breakdown is dynamic and normalized to uppercase,
     * so it automatically reflects all ShippingSessionStatus values
     * present in the queried period without hardcoding.
     *
     * Field provenance (verified against live schema + seeders):
     * - Multimodal fields (nama_mv, nama_tongkang, ciqp_status,
     *   dermaga_pelindo, waktu_sandar, lokasi_storage, license_plate,
     *   driver_name, packing_list_item, nama_penerima_site,
     *   kondisi_barang) live in report_values via template_fields,
     *   NOT as native columns — no migration needed for them.
     * - Weights live in documents.document_data (Packing List
     *   total_gross_weight / cargoDetail[].grossWeight|netWeight);
     *   session_units only carries unit_name/quantity/notes.
     * - Commercial value lives in documents.document_data
     *   (Commercial Invoice total_amount / cargoDetail[].priceOfGoods).
     * - There is NO estimated_arrival/ETA column anywhere, so the
     *   on-time rate metric is intentionally skipped (see meta.gaps).
     *
     * NOTE: the relation on ShippingSession is `units` (not
     * `sessionUnits`) — eager loads below use the real name.
     *
     * @param GenerateReportRequest|array $request
     */
    public function generateSummary(GenerateReportRequest|array $request): array
    {
        $startDate = is_array($request)
            ? ($request['start_date'] ?? now()->subDays(30)->toDateString())
            : $request->start_date;

        $endDate = is_array($request)
            ? ($request['end_date'] ?? now()->toDateString())
            : $request->end_date;

        $customerId = is_array($request) ? ($request['customer_id'] ?? null) : $request->customer_id;
        $status = is_array($request) ? ($request['status'] ?? null) : $request->status;
        $search = is_array($request) ? ($request['search'] ?? null) : ($request->input('search') ?? null);
        $sortBy = is_array($request) ? ($request['sort_by'] ?? 'created_at') : ($request->input('sort_by') ?? 'created_at');
        $sortDirection = is_array($request) ? ($request['sort_direction'] ?? 'desc') : ($request->input('sort_direction') ?? 'desc');

        // Scoping is mandatory when this service is ever used by the
        // customer role: a customer may only ever see their own company
        // data, so their authenticated customer_id always wins over any
        // request parameter.
        $authUser = auth()->user();
        if ($authUser && ($authUser->customer_id ?? null)) {
            $customerId = $authUser->customer_id;
        }

        $userName = is_array($request)
            ? (auth()->user()?->name ?? 'System')
            : ($request->user()?->name ?? auth()->user()?->name ?? 'System');

        /** @var Collection $sessions */
        $sessions = $this->shipmentRepository
            ->findByDateRange(
                $startDate,
                $endDate,
                $customerId,
                $status,
                $search,
                $sortBy,
                $sortDirection,
            )
            ->with([
                'customer:id,company_name',
                'currentCheckpoint:id,name',
                // session_units carries unit_name/quantity/notes only
                // (no weight columns) — used for total_units.
                'units',
                // document_data JSON carries weights, commercial value,
                // invoice numbers and verification timestamps.
                'documents.documentType:id,name',
                'documents.verifiedBy:id,name',
                'documents.uploadedBy:id,name',
                // actual_start / actual_finish are plain columns on
                // session_checkpoints (cast to datetime on the model),
                // so they are always loaded with the relation below and
                // available for the per-stage movement history in the PDF.
                // movements has NO timestamps of its own — departure /
                // arrival dates always come from reports.event_at or the
                // session_checkpoint actual_* columns, never movements.
                'sessionCheckpoints' => function ($q) {
                    $q->with([
                        'checkpoint:id,name,sequence',
                        'picUser:id,name',
                        'movements',
                        'reports.reportValues.templateField:id,field_key',
                        'reports.photos',
                    ]);
                },
            ])
            ->get();

        // Order each session's checkpoints by checkpoint sequence so the
        // RIWAYAT PERGERAKAN history always follows the operational order
        // (Kapal 1 -> Tongkang 2 -> Pelabuhan 3 -> Site 4).
        $sessions->each(function ($session) {
            $session->setRelation(
                'sessionCheckpoints',
                $session->sessionCheckpoints
                    ->sortBy(fn ($sc) => $sc->checkpoint?->sequence ?? 999)
                    ->values()
            );
        });

        // Dynamic breakdown normalized to uppercase
        $statusBreakdown = $sessions
            ->groupBy(function ($s) {
                $val = is_object($s->status) ? $s->status->value : (string) $s->status;
                return strtoupper((string) $val);
            })
            ->map->count();

        $checkpointBreakdown = $this->buildCheckpointBreakdown($sessions);

        $totalSessions  = $sessions->count();
        $deliveredCount = (int) ($statusBreakdown['DELIVERED'] ?? 0);
        $inTransitCount = (int) ($statusBreakdown['IN_TRANSIT'] ?? 0);

        $startFormatted = Carbon::parse($startDate)->locale('id')->translatedFormat('d F Y');
        $endFormatted   = Carbon::parse($endDate)->locale('id')->translatedFormat('d F Y');

        $narrative = $this->buildOperationalNarrative(
            $totalSessions,
            $statusBreakdown,
            $checkpointBreakdown,
            $deliveredCount,
            $inTransitCount,
            $startFormatted,
            $endFormatted,
        );

        $highlights = $this->buildOperationalHighlights(
            $totalSessions,
            $statusBreakdown,
            $checkpointBreakdown,
            $deliveredCount,
            $inTransitCount,
        );

        // Enriched analytics (all derived from real loaded data).
        $sessionsDetail = $this->buildSessionsDetail($sessions);
        $stageDurations = $this->buildStageDurations($sessionsDetail);
        $kpi = $this->buildKpi($sessions, $sessionsDetail, $stageDurations);
        $customerInsights = $this->buildCustomerInsights($sessions, $sessionsDetail);
        $documentCompliance = $this->buildDocumentCompliance($sessions);
        $exceptions = $this->buildExceptions($sessions, $sessionsDetail, $documentCompliance);

        return [
            'period'                  => [
                'start' => $startDate,
                'end'   => $endDate,
            ],
            'total_sessions'          => $totalSessions,
            'status_breakdown'        => $statusBreakdown,
            'checkpoint_breakdown'    => $checkpointBreakdown,
            'delivered_count'         => $deliveredCount,
            'in_transit_count'        => $inTransitCount,
            'operational_narrative'   => $narrative,
            'operational_summary'     => $narrative,
            'operational_highlights'  => $highlights,
            'sessions'                => $sessions,
            'generated_by'            => $userName,
            'generated_at'            => now()->format('d/m/Y H:i'),
            // --- Enriched analytics (Tahap 1) ---
            'kpi'                     => $kpi,
            'stage_durations'         => $stageDurations,
            'sessions_detail'         => $sessionsDetail,
            'customer_insights'       => $customerInsights,
            'document_compliance'     => $documentCompliance,
            'exceptions'              => $exceptions,
            'meta'                    => [
                'stagnant_threshold_days' => (int) config('reports.stagnant_days_threshold', 3),
                'gaps' => [
                    // Verified: no estimated_arrival / ETA / target column
                    // exists on shipping_sessions, session_checkpoints,
                    // documents, session_units or movements — the on-time
                    // rate metric is skipped rather than fabricated.
                    'on_time_rate' => 'skipped: no estimated_arrival/ETA column in schema',
                    // Verified: session_units has no weight columns and no
                    // flat net-weight field exists in document payloads —
                    // net weight only resolves from structured cargoDetail.
                    'net_weight' => 'partial: only available from structured cargoDetail[].netWeight, absent in flat/legacy payloads',
                ],
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Calculate how many sessions are at each active checkpoint stage.
     * Sessions without a currentCheckpoint are grouped as 'Belum Ditentukan'.
     */
    private function buildCheckpointBreakdown(Collection $sessions): SupportCollection
    {
        return $sessions
            ->groupBy(fn ($session) =>
                $session->currentCheckpoint?->name ?? 'Belum Ditentukan'
            )
            ->map->count()
            ->sortDesc();
    }

    // -------------------------------------------------------------------------
    // Tahap 1 — enriched analytics
    // -------------------------------------------------------------------------

    /**
     * Canonical 5 required document types, matched against
     * document_types.name (case-insensitive; COO also matches the
     * legacy 'Certificate of Origin (COO)' variant).
     *
     * @var list<string>
     */
    private const array REQUIRED_DOCUMENT_TYPES = [
        'Bill of Lading',
        'Commercial Invoice',
        'Packing List',
        'Certificate of Origin',
        'Insurance',
    ];

    /**
     * Multimodal / POD field keys read from report_values
     * (none of these are native columns anywhere).
     *
     * @var list<string>
     */
    private const array MULTIMODAL_FIELD_KEYS = [
        'nama_mv',
        'nama_tongkang',
        'ciqp_status',
        'dermaga_pelindo',
        'waktu_sandar',
        'lokasi_storage',
        'license_plate',
        'driver_name',
        'packing_list_item',
        'nama_penerima_site',
        'kondisi_barang',
    ];

    /**
     * Per-session detail rows (plain arrays, JSON-safe): identity,
     * real lead time from actual_start/actual_finish, per-stage
     * durations, flattened multimodal field values, units and weights.
     *
     * @param Collection $sessions
     * @return list<array<string, mixed>>
     */
    private function buildSessionsDetail(Collection $sessions): array
    {
        return $sessions->map(function ($session) {
            $ordered = $session->sessionCheckpoints
                ->sortBy(fn ($sc) => $sc->checkpoint?->sequence ?? 999)
                ->values();

            $starts = $ordered->map(fn ($sc) => $sc->actual_start)->filter();
            $finishes = $ordered->map(fn ($sc) => $sc->actual_finish)->filter();

            $startedAt = $starts->min();
            $finishedAt = $finishes->isNotEmpty() ? $finishes->max() : null;
            $isCompleted = $ordered->isNotEmpty() && $ordered->every(fn ($sc) => $sc->actual_finish !== null);

            $leadTimeHours = null;
            if ($startedAt !== null) {
                $end = $finishedAt ?? now();
                $leadTimeHours = round($startedAt->diffInMinutes($end) / 60, 1);
            }

            $stageDurations = [];
            foreach ($ordered as $sc) {
                if ($sc->actual_start !== null && $sc->actual_finish !== null) {
                    $name = $sc->checkpoint?->name ?? 'Tanpa Tahap';
                    $stageDurations[$name] = round($sc->actual_start->diffInMinutes($sc->actual_finish) / 60, 1);
                }
            }

            $fieldValues = $this->extractFieldValues($ordered);

            $unitsTotal = (int) $session->units->sum('quantity');

            ['gross' => $grossKg, 'net' => $netKg] = $this->extractSessionWeight($session);

            $statusValue = is_object($session->status) ? $session->status->value : (string) $session->status;

            return [
                'id'                => (string) $session->id,
                'assignment_no'     => $session->assignment_no,
                'customer_id'       => $session->customer_id ? (string) $session->customer_id : null,
                'customer_name'     => $session->customer?->company_name ?? '-',
                'cargo_name'        => $session->cargo_name,
                'total_quantity'    => $session->total_quantity !== null ? (float) $session->total_quantity : null,
                'unit'              => $session->unit,
                'units_total'       => $unitsTotal,
                'origin'            => $session->origin,
                'destination'       => $session->destination,
                'status'            => $statusValue,
                'current_checkpoint' => $session->currentCheckpoint?->name,
                'started_at'        => $startedAt?->toDateTimeString(),
                'finished_at'       => $finishedAt?->toDateTimeString(),
                'lead_time_hours'   => $leadTimeHours,
                'lead_time_days'    => $leadTimeHours !== null ? round($leadTimeHours / 24, 1) : null,
                'is_completed'      => $isCompleted,
                'stage_durations_hours' => $stageDurations,
                'field_values'      => $fieldValues,
                'ciqp_status'       => isset($fieldValues['ciqp_status']) ? strtoupper((string) $fieldValues['ciqp_status']) : null,
                'gross_weight_kg'   => $grossKg,
                'net_weight_kg'     => $netKg,
            ];
        })->values()->all();
    }

    /**
     * Flatten report_values to field_key => value, latest report first
     * so the newest value wins per key. Missing keys stay absent
     * (callers must treat absence as "no data", never fabricate).
     *
     * @param \Illuminate\Support\Collection $orderedCheckpoints
     * @return array<string, string>
     */
    private function extractFieldValues($orderedCheckpoints): array
    {
        $values = [];
        foreach ($orderedCheckpoints as $sc) {
            $reports = $sc->reports
                ->sortByDesc(fn ($r) => ($r->event_at ?? $r->created_at)?->timestamp ?? 0)
                ->values();
            foreach ($reports as $report) {
                foreach ($report->reportValues as $rv) {
                    $key = $rv->templateField?->field_key;
                    if ($key === null || ! in_array($key, self::MULTIMODAL_FIELD_KEYS, true)) {
                        continue;
                    }
                    if (! array_key_exists($key, $values) && $rv->value !== null && $rv->value !== '') {
                        $values[$key] = (string) $rv->value;
                    }
                }
            }
        }

        return $values;
    }

    /**
     * Average stage duration (hours/days) per checkpoint name across
     * all sessions in the period, from real actual_start/actual_finish.
     *
     * @param list<array<string, mixed>> $sessionsDetail
     * @return array<string, array{avg_hours: float, avg_days: float, samples: int}>
     */
    private function buildStageDurations(array $sessionsDetail): array
    {
        $buckets = [];
        foreach ($sessionsDetail as $detail) {
            foreach ($detail['stage_durations_hours'] as $stage => $hours) {
                $buckets[$stage][] = $hours;
            }
        }

        $result = [];
        foreach ($buckets as $stage => $hours) {
            $avg = round(array_sum($hours) / count($hours), 1);
            $result[$stage] = [
                'avg_hours' => $avg,
                'avg_days'  => round($avg / 24, 1),
                'samples'   => count($hours),
            ];
        }

        return $result;
    }

    /**
     * Top-level KPI rollup.
     *
     * @param Collection $sessions
     * @param list<array<string, mixed>> $sessionsDetail
     * @param array<string, array{avg_hours: float, avg_days: float, samples: int}> $stageDurations
     * @return array<string, mixed>
     */
    private function buildKpi(Collection $sessions, array $sessionsDetail, array $stageDurations): array
    {
        $totalUnits = array_sum(array_column($sessionsDetail, 'units_total'));
        $totalQuantity = (float) $sessions->sum('total_quantity');

        $grossValues = array_values(array_filter(
            array_column($sessionsDetail, 'gross_weight_kg'),
            fn ($v) => $v !== null
        ));
        $netValues = array_values(array_filter(
            array_column($sessionsDetail, 'net_weight_kg'),
            fn ($v) => $v !== null
        ));
        $totalGross = $grossValues === [] ? null : round(array_sum($grossValues), 2);
        $totalNet = $netValues === [] ? null : round(array_sum($netValues), 2);

        $commercial = $this->extractCommercialValue($sessions);

        $completedLeadTimes = array_values(array_filter(
            array_map(fn ($d) => $d['is_completed'] ? $d['lead_time_hours'] : null, $sessionsDetail),
            fn ($v) => $v !== null
        ));
        $avgLead = $completedLeadTimes === [] ? null : round(array_sum($completedLeadTimes) / count($completedLeadTimes), 1);

        $bottleneck = null;
        $maxAvg = -1.0;
        foreach ($stageDurations as $stage => $stat) {
            if ($stat['avg_hours'] > $maxAvg) {
                $maxAvg = $stat['avg_hours'];
                $bottleneck = $stage;
            }
        }

        $ciqp = [];
        foreach ($sessionsDetail as $detail) {
            if ($detail['ciqp_status'] !== null && $detail['ciqp_status'] !== '') {
                $ciqp[$detail['ciqp_status']] = ($ciqp[$detail['ciqp_status']] ?? 0) + 1;
            }
        }
        arsort($ciqp);

        return [
            'total_units'               => $totalUnits,
            'total_quantity'            => $totalQuantity,
            'total_gross_weight_kg'     => $totalGross,
            'total_net_weight_kg'       => $totalNet,
            'gross_weight_label'        => $totalGross !== null ? $this->formatKg($totalGross) : '-',
            'net_weight_label'          => $totalNet !== null ? $this->formatKg($totalNet) : '-',
            'weight_sessions'           => count($grossValues),
            'commercial_value_by_currency' => $commercial['by_currency'],
            'commercial_value_label'    => $commercial['label'],
            'commercial_sessions'       => $commercial['sessions'],
            'avg_lead_time_hours'       => $avgLead,
            'avg_lead_time_days'        => $avgLead !== null ? round($avgLead / 24, 1) : null,
            'completed_lead_time_count' => count($completedLeadTimes),
            'bottleneck_stage'          => $bottleneck,
            'ciqp_breakdown'            => $ciqp,
        ];
    }

    /**
     * Per-session gross/net weight in KG. Source priority per session:
     * PL cargoDetail sum → BL cargoDetail sum → CI cargoDetail sum →
     * flat PL total_gross_weight → flat BL total_gross_weight.
     * Net weight only exists in structured cargoDetail (no flat/net
     * native field anywhere) — null when absent, never zero-filled.
     *
     * @param mixed $session
     * @return array{gross: float|null, net: float|null}
     */
    private function extractSessionWeight($session): array
    {
        $byType = [];
        foreach ($session->documents as $doc) {
            $type = strtolower((string) ($doc->documentType?->name ?? ''));
            $byType[$type][] = $doc;
        }

        $find = function (string $needle) use ($byType): array {
            foreach ($byType as $type => $docs) {
                if (str_contains($type, $needle)) {
                    return $docs;
                }
            }

            return [];
        };

        $structuredGross = function (array $docs): ?float {
            $sum = 0.0;
            $found = false;
            foreach ($docs as $doc) {
                $data = is_array($doc->document_data) ? $doc->document_data : [];
                $items = $data['cargoDetail'] ?? null;
                if (! is_array($items)) {
                    continue;
                }
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $w = $this->parseWeightKg($item['grossWeight'] ?? null);
                    if ($w !== null) {
                        $sum += $w;
                        $found = true;
                    }
                }
            }

            return $found ? round($sum, 2) : null;
        };

        $structuredNet = function (array $docs): ?float {
            $sum = 0.0;
            $found = false;
            foreach ($docs as $doc) {
                $data = is_array($doc->document_data) ? $doc->document_data : [];
                $items = $data['cargoDetail'] ?? null;
                if (! is_array($items)) {
                    continue;
                }
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $w = $this->parseWeightKg($item['netWeight'] ?? null);
                    if ($w !== null) {
                        $sum += $w;
                        $found = true;
                    }
                }
            }

            return $found ? round($sum, 2) : null;
        };

        $flatGross = function (array $docs): ?float {
            foreach ($docs as $doc) {
                $data = is_array($doc->document_data) ? $doc->document_data : [];
                $w = $this->parseWeightKg($data['total_gross_weight'] ?? null);
                if ($w !== null) {
                    return $w;
                }
            }

            return null;
        };

        $plDocs = $find('packing list');
        $blDocs = $find('bill of lading');
        $ciDocs = $find('commercial invoice');

        $gross = $structuredGross($plDocs)
            ?? $structuredGross($blDocs)
            ?? $structuredGross($ciDocs)
            ?? $flatGross($plDocs)
            ?? $flatGross($blDocs);

        $net = $structuredNet($plDocs)
            ?? $structuredNet($blDocs)
            ?? $structuredNet($ciDocs);

        return ['gross' => $gross, 'net' => $net];
    }

    /**
     * Commercial value grouped by currency (never summed across
     * currencies). Per session: structured CI cargoDetail priceOfGoods
     * sums, else flat CI total_amount. Merges across sessions.
     *
     * @param Collection $sessions
     * @return array{by_currency: array<string, float>, label: string, sessions: int}
     */
    private function extractCommercialValue(Collection $sessions): array
    {
        $byCurrency = [];
        $sessionsWithValue = 0;

        foreach ($sessions as $session) {
            $sessionTotals = [];
            foreach ($session->documents as $doc) {
                $type = strtolower((string) ($doc->documentType?->name ?? ''));
                if (! str_contains($type, 'commercial invoice')) {
                    continue;
                }
                $data = is_array($doc->document_data) ? $doc->document_data : [];

                $items = $data['cargoDetail'] ?? null;
                if (is_array($items) && $items !== []) {
                    foreach ($items as $item) {
                        if (! is_array($item) || ! isset($item['priceOfGoods'])) {
                            continue;
                        }
                        $amount = $this->parseNumber($item['priceOfGoods']);
                        if ($amount === null) {
                            continue;
                        }
                        $currency = strtoupper((string) ($item['currency'] ?? 'UNSPECIFIED'));
                        $sessionTotals[$currency] = ($sessionTotals[$currency] ?? 0.0) + $amount;
                    }
                    continue;
                }

                $parsed = $this->parseAmount((string) ($data['total_amount'] ?? ''));
                if ($parsed !== null) {
                    [$currency, $amount] = $parsed;
                    $sessionTotals[$currency] = ($sessionTotals[$currency] ?? 0.0) + $amount;
                }
            }

            if ($sessionTotals !== []) {
                $sessionsWithValue++;
                foreach ($sessionTotals as $currency => $amount) {
                    $byCurrency[$currency] = round(($byCurrency[$currency] ?? 0.0) + $amount, 2);
                }
            }
        }

        ksort($byCurrency);

        $parts = [];
        foreach ($byCurrency as $currency => $amount) {
            $parts[] = $currency.' '.number_format($amount, 0, ',', '.');
        }

        return [
            'by_currency' => $byCurrency,
            'label'       => $parts === [] ? '-' : implode('; ', $parts),
            'sessions'    => $sessionsWithValue,
        ];
    }

    /**
     * Per-customer rollup: session counts, delivered/in-transit split
     * with delivered ratio, and average completed lead time.
     *
     * @param Collection $sessions
     * @param list<array<string, mixed>> $sessionsDetail
     * @return list<array<string, mixed>>
     */
    private function buildCustomerInsights(Collection $sessions, array $sessionsDetail): array
    {
        $detailById = [];
        foreach ($sessionsDetail as $detail) {
            $detailById[$detail['id']] = $detail;
        }

        $grouped = $sessions->groupBy(fn ($s) => $s->customer_id ? (string) $s->customer_id : 'unknown');

        return $grouped->map(function ($group, $customerId) use ($detailById) {
            $first = $group->first();
            $statuses = $group->map(fn ($s) => strtolower(is_object($s->status) ? $s->status->value : (string) $s->status));

            $delivered = $statuses->filter(fn ($s) => $s === 'delivered')->count();
            $inTransit = $statuses->filter(fn ($s) => $s === 'in_transit')->count();
            $total = $group->count();

            $leadTimes = [];
            foreach ($group as $s) {
                $d = $detailById[(string) $s->id] ?? null;
                if ($d !== null && $d['is_completed'] && $d['lead_time_hours'] !== null) {
                    $leadTimes[] = $d['lead_time_hours'];
                }
            }
            $avgLead = $leadTimes === [] ? null : round(array_sum($leadTimes) / count($leadTimes), 1);

            return [
                'customer_id'           => $customerId === 'unknown' ? null : $customerId,
                'company_name'          => $first->customer?->company_name ?? '-',
                'total_sessions'        => $total,
                'delivered'             => $delivered,
                'in_transit'            => $inTransit,
                'delivered_ratio'       => $total > 0 ? round($delivered / $total, 3) : 0.0,
                'avg_lead_time_hours'   => $avgLead,
                'avg_lead_time_days'    => $avgLead !== null ? round($avgLead / 24, 1) : null,
                'completed_lead_times'  => count($leadTimes),
            ];
        })->sortByDesc('total_sessions')->values()->all();
    }

    /**
     * Document compliance per session against the 5 required types:
     * presence, verification status, verifier, verification duration
     * (verified_at − uploaded_at, uploaded_at defaults to now on
     * create so it mirrors created_at), and REJECTED remarks.
     *
     * @param Collection $sessions
     * @return list<array<string, mixed>>
     */
    private function buildDocumentCompliance(Collection $sessions): array
    {
        return $sessions->map(function ($session) {
            $byType = [];
            foreach ($session->documents as $doc) {
                $key = $this->normalizeDocumentType((string) ($doc->documentType?->name ?? ''));
                if ($key !== null && ! isset($byType[$key])) {
                    $byType[$key] = $doc;
                }
            }

            $types = [];
            $verifiedCount = 0;
            $rejected = [];
            foreach (self::REQUIRED_DOCUMENT_TYPES as $required) {
                $doc = $byType[$required] ?? null;
                if ($doc === null) {
                    $types[$required] = ['present' => false, 'status' => null];
                    continue;
                }

                $rawStatus = is_object($doc->status) ? $doc->status->value : (string) $doc->status;
                $status = strtoupper($rawStatus);
                if ($status === 'VERIFIED') {
                    $verifiedCount++;
                }

                $data = is_array($doc->document_data) ? $doc->document_data : [];
                $base = is_array($data['documentDetail'] ?? null) ? $data['documentDetail'] : [];

                $verificationHours = null;
                if ($doc->verified_at !== null) {
                    $from = $doc->uploaded_at ?? $doc->created_at;
                    if ($from !== null) {
                        $verificationHours = round($from->diffInMinutes($doc->verified_at) / 60, 1);
                    }
                }

                $types[$required] = [
                    'present'            => true,
                    'status'             => $status,
                    'document_number'    => $data['document_number'] ?? $base['number'] ?? null,
                    'verified_by'        => $doc->verifiedBy?->name,
                    'verified_at'        => $doc->verified_at?->toDateTimeString(),
                    'verification_hours' => $verificationHours,
                    'remarks'            => $doc->remarks,
                ];

                if ($status === 'REJECTED') {
                    $rejected[] = [
                        'document_type' => $required,
                        'remarks'       => $doc->remarks,
                        'verified_by'   => $doc->verifiedBy?->name,
                    ];
                }
            }

            return [
                'session_id'    => (string) $session->id,
                'assignment_no' => $session->assignment_no,
                'customer_name' => $session->customer?->company_name ?? '-',
                'complete'      => count($byType) === count(self::REQUIRED_DOCUMENT_TYPES) && $verifiedCount === count(self::REQUIRED_DOCUMENT_TYPES),
                'verified'      => $verifiedCount,
                'required'      => count(self::REQUIRED_DOCUMENT_TYPES),
                'types'         => $types,
                'rejected'      => $rejected,
            ];
        })->values()->all();
    }

    /**
     * Exceptions: stagnant shipments (active stage running longer
     * than the configured threshold), rejected documents and
     * sessions with unverified documents.
     *
     * @param Collection $sessions
     * @param list<array<string, mixed>> $sessionsDetail
     * @param list<array<string, mixed>> $documentCompliance
     * @return array<string, mixed>
     */
    private function buildExceptions(Collection $sessions, array $sessionsDetail, array $documentCompliance): array
    {
        $thresholdDays = (int) config('reports.stagnant_days_threshold', 3);

        $detailById = [];
        foreach ($sessionsDetail as $detail) {
            $detailById[$detail['id']] = $detail;
        }

        $stagnant = [];
        foreach ($sessions as $session) {
            $statusValue = strtolower(is_object($session->status) ? $session->status->value : (string) $session->status);
            if ($statusValue === 'delivered') {
                continue;
            }

            $active = $session->sessionCheckpoints
                ->first(fn ($sc) => strtolower(is_object($sc->status) ? $sc->status->value : (string) $sc->status) === 'in_progress')
                ?? $session->sessionCheckpoints
                    ->filter(fn ($sc) => $sc->actual_start !== null && $sc->actual_finish === null)
                    ->sortByDesc(fn ($sc) => $sc->actual_start?->timestamp ?? 0)
                    ->first();

            if ($active === null) {
                continue;
            }

            $since = $active->actual_start ?? $active->created_at;
            if ($since === null) {
                continue;
            }

            $days = round($since->diffInMinutes(now()) / 1440, 1);
            if ($days > $thresholdDays) {
                $stagnant[] = [
                    'session_id'    => (string) $session->id,
                    'assignment_no' => $session->assignment_no,
                    'customer_name' => $session->customer?->company_name ?? '-',
                    'stage'         => $active->checkpoint?->name ?? '-',
                    'pic'           => $active->picUser?->name,
                    'stuck_days'    => $days,
                    'since'         => $since->toDateTimeString(),
                ];
            }
        }

        usort($stagnant, fn ($a, $b) => $b['stuck_days'] <=> $a['stuck_days']);

        $rejectedDocuments = [];
        $unverifiedSessions = [];
        foreach ($documentCompliance as $entry) {
            foreach ($entry['rejected'] as $rej) {
                $rejectedDocuments[] = [
                    'assignment_no' => $entry['assignment_no'],
                    'customer_name' => $entry['customer_name'],
                    ...$rej,
                ];
            }
            if (! $entry['complete']) {
                $missing = [];
                foreach ($entry['types'] as $type => $info) {
                    if (! $info['present']) {
                        $missing[] = $type;
                    } elseif (strtoupper((string) ($info['status'] ?? '')) !== 'VERIFIED') {
                        $missing[] = $type.' ('.strtolower((string) $info['status']).')';
                    }
                }
                $unverifiedSessions[] = [
                    'assignment_no' => $entry['assignment_no'],
                    'customer_name' => $entry['customer_name'],
                    'verified'      => $entry['verified'],
                    'required'      => $entry['required'],
                    'pending_items' => $missing,
                ];
            }
        }

        return [
            'stagnant'            => $stagnant,
            'rejected_documents'  => $rejectedDocuments,
            'unverified_sessions' => $unverifiedSessions,
        ];
    }

    /**
     * Map a document_types.name to its canonical required-type label.
     */
    private function normalizeDocumentType(string $name): ?string
    {
        $needle = strtolower(trim($name));
        foreach (self::REQUIRED_DOCUMENT_TYPES as $required) {
            $base = strtolower($required);
            if ($needle === $base) {
                return $required;
            }
            // Legacy variant seeded in some environments.
            if ($base === 'certificate of origin' && str_starts_with($needle, 'certificate of origin')) {
                return $required;
            }
        }

        return null;
    }

    /**
     * Parse a weight-ish scalar to KG. Handles thousand-grouped
     * "48,500 KG" / "1.000.000", decimal-comma "48,5", plain numbers
     * and ton/tonne suffixes (×1000). Returns null when unparseable.
     */
    private function parseWeightKg(mixed $raw): ?float
    {
        if ($raw === null) {
            return null;
        }
        $s = trim((string) $raw);
        if ($s === '' || $s === '-') {
            return null;
        }

        $isTon = (bool) preg_match('/\b(tons?|tonnes?|t)\b\.?$/i', $s);
        $s = trim((string) preg_replace('/\s*(kgs?|kilograms?|tons?|tonnes?|t)\s*\.?$/i', '', $s));
        $s = str_replace(' ', '', $s);

        if (preg_match('/^\d{1,3}(\.\d{3})+(,\d+)?$/', $s)) {
            // Indonesian thousand grouping: 1.000.000 / 48.500
            $s = str_replace('.', '', $s);
            $s = str_replace(',', '.', $s);
        } elseif (preg_match('/^\d{1,3}(,\d{3})+(\.\d+)?$/', $s)) {
            // English thousand grouping: 48,500 / 1,000.5
            $s = str_replace(',', '', $s);
        } elseif (preg_match('/^\d+,\d{1,3}$/', $s)) {
            // Decimal comma: 48,5
            $s = str_replace(',', '.', $s);
        } else {
            $s = str_replace(',', '', $s);
        }

        if (! is_numeric($s)) {
            return null;
        }

        $value = (float) $s;

        return round($isTon ? $value * 1000 : $value, 2);
    }

    /**
     * Parse a bare numeric scalar (structured cargo payloads).
     */
    private function parseNumber(mixed $raw): ?float
    {
        if ($raw === null) {
            return null;
        }
        $s = trim((string) $raw);
        if ($s === '' || $s === '-') {
            return null;
        }
        $s = str_replace([' ', ','], '', $s);

        return is_numeric($s) ? (float) $s : null;
    }

    /**
     * Parse "USD 145,000" / "IDR 5,000,000,000" / "Rp 1.000.000"
     * into [CURRENCY, amount]. Returns null when unparseable.
     *
     * @return array{0: string, 1: float}|null
     */
    private function parseAmount(string $raw): ?array
    {
        $s = trim($raw);
        if ($s === '' || $s === '-') {
            return null;
        }

        $currency = null;
        if (preg_match('/^([A-Za-z]{2,4}|Rp\.?)\s+(.+)$/', $s, $m)) {
            $currency = strtoupper(rtrim($m[1], '.'));
            $s = trim($m[2]);
        }

        if ($currency === 'RP') {
            $currency = 'IDR';
        }

        $amount = $this->parseWeightKg($s);
        if ($amount === null) {
            return null;
        }

        return [$currency ?? 'UNSPECIFIED', $amount];
    }

    /**
     * Format KG with Indonesian thousand separators.
     */
    private function formatKg(float $kg): string
    {
        $decimals = abs($kg - round($kg)) < 0.005 ? 0 : 1;

        return number_format($kg, $decimals, ',', '.').' KG';
    }

    /**
     * Resolve a natural-language label for a status_breakdown key.
     * Keys are uppercase enum values (e.g. "IN_TRANSIT"); known values
     * use the enum's label(), anything else falls back to lowercase text
     * so the breakdown stays dynamic without hardcoding.
     */
    private function statusLabel(string|int $status): string
    {
        $enum = \App\Enums\ShippingSessionStatus::tryFrom(strtolower((string) $status));

        return $enum?->label() ?? strtolower((string) $status);
    }

    /**
     * Build a cohesive narrative paragraph describing the operational state
     * during the report period. All facts come from aggregated data.
     * Statuses are rendered with natural labels, never raw enum values.
     *
     * Rules:
     *  0. No sessions     => short tidak ada aktivitas message.
     *  1. All delivered   => positive closing statement.
     *  2. Mixed statuses  => describe delivered + in-transit split + pending/other.
     *  3. Checkpoint dist => explain where in-transit sessions currently stand.
     *  4. Closing note    => monitoring reminder when in-transit > 0.
     */
    private function buildOperationalNarrative(
        int $totalSessions,
        SupportCollection $statusBreakdown,
        SupportCollection $checkpointBreakdown,
        int $deliveredCount,
        int $inTransitCount,
        string $startFormatted,
        string $endFormatted,
    ): string {
        // Rule 0 - No data
        if ($totalSessions === 0) {
            return "Tidak terdapat aktivitas pengiriman yang tercatat pada periode laporan ini ({$startFormatted} sampai {$endFormatted}). "
                . "Pastikan rentang tanggal atau filter yang dipilih sudah sesuai.";
        }

        $parts = [];

        // Opening - total sessions
        $parts[] = "Selama periode {$startFormatted} sampai {$endFormatted}, terdapat {$totalSessions} sesi pengiriman yang tercatat dalam sistem.";

        // Rule 1 - All delivered
        if ($deliveredCount === $totalSessions) {
            $parts[] = "Seluruh {$totalSessions} sesi pengiriman pada periode laporan {$this->statusLabel('DELIVERED')}.";
            $parts[] = "Tidak terdapat sesi yang masih dalam proses pengiriman pada periode ini.";
            return implode(' ', $parts);
        }

        // Rule 2 - Mix: delivered + in-transit (or other statuses)
        if ($deliveredCount > 0 && $inTransitCount > 0) {
            $parts[] = "Dari jumlah tersebut, {$deliveredCount} sesi {$this->statusLabel('DELIVERED')}, "
                . "sementara {$inTransitCount} sesi lainnya {$this->statusLabel('IN_TRANSIT')}.";
        } elseif ($deliveredCount > 0) {
            $parts[] = "Dari jumlah tersebut, {$deliveredCount} sesi {$this->statusLabel('DELIVERED')}.";
        } elseif ($inTransitCount > 0) {
            $parts[] = "Seluruh {$inTransitCount} sesi yang tercatat pada periode ini {$this->statusLabel('IN_TRANSIT')}.";
        }

        // Pending or other statuses
        $pendingCount = (int) ($statusBreakdown['PENDING'] ?? 0);
        if ($pendingCount > 0) {
            $parts[] = "Selain itu, terdapat {$pendingCount} sesi {$this->statusLabel('PENDING')}.";
        }

        $otherStatuses = $statusBreakdown->filter(function ($count, $status) {
            $upper = strtoupper((string) $status);
            return ! in_array($upper, ['DELIVERED', 'IN_TRANSIT', 'PENDING'], true) && $count > 0;
        });

        if ($otherStatuses->isNotEmpty()) {
            $otherSummary = $otherStatuses
                ->map(fn ($count, $status) => "{$count} sesi " . $this->statusLabel((string) $status))
                ->implode(', ');
            $parts[] = "Terdapat pula {$otherSummary}.";
        }

        // Rule 3 - Checkpoint distribution (only meaningful when in-transit > 0)
        $meaningfulCheckpoints = $checkpointBreakdown->filter(
            fn ($count, $name) => $name !== 'Belum Ditentukan' && $count > 0
        );

        if ($inTransitCount > 0 && $meaningfulCheckpoints->isNotEmpty()) {
            if ($meaningfulCheckpoints->count() === 1) {
                $cpName  = $meaningfulCheckpoints->keys()->first();
                $cpCount = $meaningfulCheckpoints->first();
                $parts[] = "Seluruh sesi yang masih berjalan saat ini berada pada tahap {$cpName} ({$cpCount} sesi).";
            } else {
                $checkpointSummary = $meaningfulCheckpoints
                    ->map(fn ($cnt, $nm) => "tahap {$nm} ({$cnt} sesi)")
                    ->implode(', ');
                $parts[] = "Berdasarkan posisi tahap terkini, distribusi sesi yang masih berjalan mencakup {$checkpointSummary}.";
            }
        }

        // Rule 4 - Closing monitoring note
        if ($inTransitCount > 0) {
            $parts[] = "Secara keseluruhan, sebagian besar aktivitas operasional pada periode laporan masih berjalan dan memerlukan monitoring lanjutan hingga seluruh sesi mencapai Site.";
        }

        return implode(' ', $parts);
    }

    /**
     * Build a list of concise operational highlight bullet strings.
     * Zero-count items are never shown.
     *
     * @return list<string>
     */
    private function buildOperationalHighlights(
        int $totalSessions,
        SupportCollection $statusBreakdown,
        SupportCollection $checkpointBreakdown,
        int $deliveredCount,
        int $inTransitCount,
    ): array {
        if ($totalSessions === 0) {
            return ['Tidak terdapat aktivitas pengiriman pada periode ini.'];
        }

        $highlights = [];

        // Total
        $highlights[] = "{$totalSessions} sesi pengiriman tercatat selama periode laporan.";

        // Per-status breakdown (only non-zero, natural labels)
        foreach ($statusBreakdown as $status => $count) {
            $pct           = round(($count / $totalSessions) * 100, 1);
            $highlights[]  = "{$count} sesi ({$pct}%) " . $this->statusLabel((string) $status) . ".";
        }

        // Checkpoint distribution (only meaningful for in-transit context)
        if ($inTransitCount > 0) {
            $meaningfulCheckpoints = $checkpointBreakdown->filter(
                fn ($count, $name) => $name !== 'Belum Ditentukan' && $count > 0
            );
            foreach ($meaningfulCheckpoints as $name => $count) {
                $highlights[] = "Tahap {$name}: {$count} sesi sedang aktif.";
            }
        }

        // Positive closing if all done
        if ($deliveredCount === $totalSessions) {
            $highlights[] = "Seluruh sesi pengiriman pada periode ini " . $this->statusLabel('DELIVERED') . ".";
        }

        return $highlights;
    }
}
