<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\DocumentStatus;
use App\Enums\MovementStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Document;
use App\Models\Movement;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the internal operational dashboard (control tower).
     *
     * Legacy props (stats, recentSessions, masterCheckpoints) are kept
     * for backward compatibility; the operational_* props below drive
     * the control-tower zones. Everything comes from real tables —
     * no dummy data, no new tables.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole('customer')) {
            return redirect()->route('customer.dashboard');
        }

        $masterCheckpoints = Checkpoint::orderBy('sequence')->get();

        $trendFilter = $this->resolveTrendFilter($request);

        $stats = [
            'total_users'         => User::count(),
            'total_shipments'     => ShippingSession::count(),
            'in_transit_shipments' => ShippingSession::where('status', ShippingSessionStatus::IN_TRANSIT->value)->count(),
            'pending_shipments'   => ShippingSession::where('status', ShippingSessionStatus::PENDING->value)->count(),
        ];

        $recentShipments = ShippingSession::with(['customer', 'currentCheckpoint'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (ShippingSession $s) => [
                'id'               => $s->id,
                'assignment_no'    => $s->assignment_no,
                'cargo_name'       => $s->cargo_name,
                'customer_name'    => $s->customer?->company_name,
                'origin'           => $s->origin,
                'destination'      => $s->destination,
                'status'           => $s->status instanceof \BackedEnum ? $s->status->value : (string) $s->status,
                'created_at'       => $s->created_at?->toISOString(),
                'current_checkpoint' => $s->currentCheckpoint ? ['id' => $s->currentCheckpoint->id, 'name' => $s->currentCheckpoint->name] : null,
            ])
            ->values()
            ->toArray();

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recent_shipments' => $recentShipments,
            'recentSessions' => $recentShipments,
            'shipment_trends' => $this->getShipmentTrends($trendFilter),
            'trend_meta' => $trendFilter,
            'checkpoint_pipeline' => $this->getCheckpointPipeline(),
            'masterCheckpoints' => $masterCheckpoints,
            'operational_kpis' => $this->getOperationalKpis(),
            'operational_pipeline' => $this->getOperationalPipeline($masterCheckpoints),
            'operational_shipments' => $this->getOperationalShipments($masterCheckpoints),
            'operational_feed' => $this->getOperationalFeed(),
            'operational_alerts' => $this->getOperationalAlerts(),
        ]);
    }

    /**
     * Five operational KPIs from real aggregates.
     *
     * @return array<string, mixed>
     */
    private function getOperationalKpis(): array
    {
        $activeShipments = ShippingSession::where('status', ShippingSessionStatus::IN_TRANSIT->value)->count();

        $pendingDocuments = Document::where('status', DocumentStatus::PENDING->value)->count();
        $pendingAssignments = Document::where('status', DocumentStatus::PENDING->value)
            ->distinct()
            ->count('assignment_no_ref');

        $activeMovements = Movement::where('status', MovementStatus::IN_PROGRESS->value)->count();

        $totalQuantity = (float) ShippingSession::sum('total_quantity');
        $primaryUnit = ShippingSession::selectRaw('unit, COUNT(*) as c')
            ->groupBy('unit')
            ->orderByDesc('c')
            ->value('unit');

        $delivered = ShippingSession::where('status', ShippingSessionStatus::DELIVERED->value)->count();
        $total = ShippingSession::count();

        return [
            'active_shipments'   => $activeShipments,
            'pending_documents'  => $pendingDocuments,
            'pending_assignments' => $pendingAssignments,
            'active_movements'   => $activeMovements,
            'total_quantity'     => $totalQuantity,
            'quantity_unit'      => $primaryUnit,
            'delivered_count'    => $delivered,
            'total_count'        => $total,
            'delivery_rate'      => $total > 0 ? round($delivered / $total * 100, 1) : 0.0,
        ];
    }

    /**
     * Sessions positioned per master checkpoint (by current_checkpoint_id),
     * zeros included. Drives the pipeline tracker + table filter.
     *
     * @param \Illuminate\Database\Eloquent\Collection<int, Checkpoint> $masterCheckpoints
     * @return array<int, array{id: int, name: string, sequence: int, count: int}>
     */
    private function getOperationalPipeline($masterCheckpoints): array
    {
        $counts = ShippingSession::selectRaw('current_checkpoint_id, COUNT(*) as c')
            ->whereNotNull('current_checkpoint_id')
            ->groupBy('current_checkpoint_id')
            ->pluck('c', 'current_checkpoint_id');

        return $masterCheckpoints->map(fn (Checkpoint $cp) => [
            'id'       => $cp->id,
            'name'     => $cp->name,
            'sequence' => $cp->sequence,
            'count'    => (int) ($counts[$cp->id] ?? 0),
        ])->values()->toArray();
    }

    /**
     * Latest 20 sessions with relations needed for the ops table.
     * Active in-progress movements are attached via one extra query
     * (no N+1).
     *
     * @param \Illuminate\Database\Eloquent\Collection<int, Checkpoint> $masterCheckpoints
     * @return array<int, array<string, mixed>>
     */
    private function getOperationalShipments($masterCheckpoints): array
    {
        $stageTotal = max($masterCheckpoints->count(), 1);

        $sessions = ShippingSession::with([
                'customer:id,company_name',
                'currentCheckpoint:id,name',
                'units:shipping_session_id,unit_name,quantity',
                'sessionCheckpoints.checkpoint:id,name,sequence',
            ])
            ->latest()
            ->take(20)
            ->get();

        $movementsBySession = Movement::where('status', MovementStatus::IN_PROGRESS->value)
            ->with('sessionCheckpoint:id,shipping_session_id')
            ->take(200)
            ->get()
            ->groupBy(fn (Movement $m) => $m->sessionCheckpoint?->shipping_session_id);

        return $sessions->map(function (ShippingSession $s) use ($movementsBySession, $stageTotal) {
            $stages = $s->sessionCheckpoints;
            $finished = $stages->filter(fn ($sc) => $sc->actual_finish !== null)->count();
            $total = max($stages->count(), $stageTotal);

            $activeMovements = ($movementsBySession[(string) $s->id] ?? collect())
                ->map(fn (Movement $m) => $m->movement_name)
                ->values()
                ->all();

            return [
                'id'               => $s->id,
                'assignment_no'    => $s->assignment_no,
                'cargo_name'       => $s->cargo_name,
                'total_quantity'   => $s->total_quantity !== null ? (float) $s->total_quantity : null,
                'unit'             => $s->unit,
                'units_total'      => (int) $s->units->sum('quantity'),
                'customer_name'    => $s->customer?->company_name,
                'origin'           => $s->origin,
                'destination'      => $s->destination,
                'status'           => $s->status instanceof \BackedEnum ? $s->status->value : (string) $s->status,
                'current_checkpoint_id' => $s->current_checkpoint_id,
                'current_checkpoint' => $s->currentCheckpoint?->name,
                'progress_pct'     => (int) round($finished / $total * 100),
                'finished_stages'  => $finished,
                'total_stages'     => $total,
                'active_movements' => $activeMovements,
                'updated_at'       => $s->updated_at?->toISOString(),
            ];
        })->values()->toArray();
    }

    /**
     * Live activity feed from real timestamped sources only:
     * field reports, document verifications, finished stages.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getOperationalFeed(): array
    {
        $items = collect();

        $reports = Report::with([
                'createdBy:id,name',
                'sessionCheckpoint.checkpoint:id,name',
                'sessionCheckpoint.shippingSession:id,assignment_no',
            ])
            ->whereNotNull('event_at')
            ->orderByDesc('event_at')
            ->take(6)
            ->get();

        foreach ($reports as $report) {
            $sc = $report->sessionCheckpoint;
            $items->push([
                'kind'   => 'report',
                'title'  => 'Field report '.($sc?->checkpoint?->name ?? ''),
                'actor'  => $report->createdBy?->name,
                'at'     => $report->event_at?->toISOString(),
                'ref'    => $sc?->shippingSession?->assignment_no,
                'status' => $report->status instanceof \BackedEnum ? $report->status->value : (string) $report->status,
            ]);
        }

        $docs = Document::with(['verifiedBy:id,name', 'documentType:id,name', 'shippingSession:id,assignment_no'])
            ->where('status', DocumentStatus::VERIFIED->value)
            ->whereNotNull('verified_at')
            ->orderByDesc('verified_at')
            ->take(4)
            ->get();

        foreach ($docs as $doc) {
            $items->push([
                'kind'   => 'verification',
                'title'  => ($doc->documentType?->name ?? 'Document').' verified',
                'actor'  => $doc->verifiedBy?->name,
                'at'     => $doc->verified_at?->toISOString(),
                'ref'    => $doc->shippingSession?->assignment_no ?? $doc->assignment_no_ref,
                'status' => 'verified',
            ]);
        }

        $stages = SessionCheckpoint::with(['picUser:id,name', 'checkpoint:id,name', 'shippingSession:id,assignment_no'])
            ->where('status', SessionCheckpointStatus::COMPLETED->value)
            ->whereNotNull('actual_finish')
            ->orderByDesc('actual_finish')
            ->take(4)
            ->get();

        foreach ($stages as $sc) {
            $items->push([
                'kind'   => 'stage',
                'title'  => ($sc->checkpoint?->name ?? '').' stage completed',
                'actor'  => $sc->picUser?->name,
                'at'     => $sc->actual_finish?->toISOString(),
                'ref'    => $sc->shippingSession?->assignment_no,
                'status' => 'completed',
            ]);
        }

        return $items
            ->filter(fn ($i) => $i['at'] !== null)
            ->sortByDesc('at')
            ->take(12)
            ->values()
            ->toArray();
    }

    /**
     * Dynamic alerts from real data: pending verification queue and
     * sessions with unfinished stages lacking a PIC assignment.
     *
     * @return array<string, mixed>
     */
    private function getOperationalAlerts(): array
    {
        $pendingDocuments = Document::where('status', DocumentStatus::PENDING->value)->count();
        $pendingAssignments = Document::where('status', DocumentStatus::PENDING->value)
            ->distinct()
            ->count('assignment_no_ref');

        $unassigned = SessionCheckpoint::with('shippingSession:id,assignment_no')
            ->whereNull('pic_user_id')
            ->whereNotIn('status', [SessionCheckpointStatus::COMPLETED->value, 'COMPLETED'])
            ->whereHas('shippingSession', fn ($q) => $q->where('status', '!=', ShippingSessionStatus::DELIVERED->value))
            ->take(50)
            ->get()
            ->groupBy(fn ($sc) => (string) $sc->shipping_session_id)
            ->map(fn ($group) => [
                'session_id'    => (string) $group->first()->shipping_session_id,
                'assignment_no' => $group->first()->shippingSession?->assignment_no,
            ])
            ->values()
            ->toArray();

        return [
            'pending_documents'   => $pendingDocuments,
            'pending_assignments' => $pendingAssignments,
            'unassigned_sessions' => $unassigned,
            'unassigned_count'    => count($unassigned),
        ];
    }

    /**
     * Resolve and sanitize the trend-chart period filter from the query
     * string. Modes: harian (days of a month), bulanan (months of a
     * year), tahunan (one bar per available year).
     *
     * @return array{mode: string, year: int, month: int|null, years: list<int>}
     */
    private function resolveTrendFilter(Request $request): array
    {
        $years = ShippingSession::selectRaw('EXTRACT(YEAR FROM created_at)::int as y')
            ->distinct()
            ->orderByDesc('y')
            ->pluck('y')
            ->map(fn ($y) => (int) $y)
            ->all();

        $currentYear = (int) now()->year;
        if (! in_array($currentYear, $years, true)) {
            array_unshift($years, $currentYear);
        }
        rsort($years);

        $mode = strtolower((string) $request->input('trend_mode', 'bulanan'));
        if (! in_array($mode, ['harian', 'bulanan', 'tahunan'], true)) {
            $mode = 'bulanan';
        }

        $year = (int) $request->input('trend_year', $currentYear);
        if ($year < 2000 || $year > 2100) {
            $year = $currentYear;
        }

        $month = $request->input('trend_month');
        $month = is_numeric($month) ? (int) $month : null;
        if ($month !== null && ($month < 1 || $month > 12)) {
            $month = null;
        }
        if ($mode === 'harian' && $month === null) {
            $mode = 'bulanan';
        }

        return ['mode' => $mode, 'year' => $year, 'month' => $month, 'years' => array_values($years)];
    }

    /**
     * Shipment volume trend for the requested period filter.
     *
     * @param array{mode: string, year: int, month: int|null, years: list<int>} $filter
     * @return array<int, array{month: string, year: int, total: int}>
     */
    private function getShipmentTrends(array $filter): array
    {
        if ($filter['mode'] === 'tahunan') {
            $trends = [];
            foreach ($filter['years'] as $year) {
                $trends[] = [
                    'month' => (string) $year,
                    'year'  => $year,
                    'total' => ShippingSession::whereYear('created_at', $year)->count(),
                ];
            }

            return $trends;
        }

        if ($filter['mode'] === 'harian' && $filter['month'] !== null) {
            $daysInMonth = \Carbon\Carbon::create($filter['year'], $filter['month'], 1)->daysInMonth;
            $trends = [];
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $trends[] = [
                    'month' => (string) $day,
                    'year'  => $filter['year'],
                    'total' => ShippingSession::whereYear('created_at', $filter['year'])
                        ->whereMonth('created_at', $filter['month'])
                        ->whereDay('created_at', $day)
                        ->count(),
                ];
            }

            return $trends;
        }

        $trends = [];
        for ($month = 1; $month <= 12; $month++) {
            $trends[] = [
                'month' => self::indonesianMonthName($month),
                'year'  => $filter['year'],
                'total' => ShippingSession::whereYear('created_at', $filter['year'])
                    ->whereMonth('created_at', $month)
                    ->count(),
            ];
        }

        return $trends;
    }

    private static function indonesianMonthName(int $month): string
    {
        return match ($month) {
            1 => 'Jan',
            2 => 'Feb',
            3 => 'Mar',
            4 => 'Apr',
            5 => 'Mei',
            6 => 'Jun',
            7 => 'Jul',
            8 => 'Agu',
            9 => 'Sep',
            10 => 'Okt',
            11 => 'Nov',
            12 => 'Des',
            default => '-',
        };
    }

    /**
     * Get active shipping sessions count grouped by checkpoint sequence.
     *
     * @return array<int, array{name: string, count: int}>
     */
    private function getCheckpointPipeline(): array
    {
        return Checkpoint::orderBy('sequence')
            ->withCount(['sessionCheckpoints as active_count' => function ($query) {
                $query->whereNotNull('actual_start')->whereNull('actual_finish');
            }])
            ->get()
            ->map(fn (Checkpoint $cp) => [
                'name' => $cp->name,
                'count' => (int) $cp->active_count,
            ])
            ->values()
            ->toArray();
    }
}
