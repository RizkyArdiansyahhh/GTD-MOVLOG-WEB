<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ShippingSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
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
     * Display the internal role dashboard.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole('customer')) {
            return redirect()->route('customer.dashboard');
        }

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
            'shipment_trends' => $this->getShipmentTrends(),
            'checkpoint_pipeline' => $this->getCheckpointPipeline(),
            'masterCheckpoints' => Checkpoint::orderBy('sequence')->get(),
        ]);
    }

    /**
     * Get monthly shipment volume trends for the last 6 months.
     *
     * @return array<int, array{month: string, year: int, total: int}>
     */
    private function getShipmentTrends(): array
    {
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $target = now()->subMonths($i);
            $year = (int) $target->year;
            $month = (int) $target->month;

            $count = ShippingSession::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();

            $monthName = match ($month) {
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
            };

            $trends[] = [
                'month' => $monthName,
                'year' => $year,
                'total' => $count,
            ];
        }

        return $trends;
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
