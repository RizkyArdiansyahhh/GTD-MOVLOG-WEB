<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\DocumentStatus;
use App\Enums\SessionCheckpointStatus;
use App\Enums\ShippingSessionStatus;
use App\Http\Controllers\Controller;
use App\Models\Checkpoint;
use App\Models\Customer;
use App\Models\Document;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    /**
     * Helper to retrieve the authenticated customer profile.
     */
    private function getCustomer(Request $request): Customer
    {
        $user = $request->user();
        $customer = $user?->customer;

        if (!$customer && $user) {
            $customer = Customer::firstOrCreate(
                ['email' => $user->email],
                [
                    'company_name' => $user->name,
                    'pic_name'     => $user->name,
                    'email'        => $user->email,
                ]
            );
            $user->update(['customer_id' => $customer->id]);
            $user->setRelation('customer', $customer);
        }

        if (!$customer) {
            abort(403, 'Akun Anda belum terhubung ke perusahaan customer manapun. Hubungi Admin GTD untuk menyelesaikan konfigurasi akun.');
        }

        return $customer;
    }

    /**
     * Calculate progress percentage for a shipping session.
     */
    private function calculateProgress(ShippingSession $session): int
    {
        $total = $session->sessionCheckpoints->count();
        if ($total === 0) {
            return 0;
        }

        $completed = $session->sessionCheckpoints->filter(function ($sc) {
            $statusVal = is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status;
            return in_array(strtoupper($statusVal), ['COMPLETED', 'SELESAI'], true);
        })->count();

        return (int) round(($completed / $total) * 100);
    }

    /**
     * Estimate ETA based on remaining checkpoints (2 days per remaining checkpoint).
     */
    private function estimateEta(ShippingSession $session): string
    {
        $total = $session->sessionCheckpoints->count();
        $completedOrSkipped = $session->sessionCheckpoints->filter(function ($sc) {
            $statusVal = is_object($sc->status) ? ($sc->status->value ?? (string) $sc->status) : (string) $sc->status;
            return in_array(strtoupper($statusVal), ['COMPLETED', 'SKIPPED', 'SELESAI', 'DILEWATI'], true);
        })->count();

        $remaining = max(0, $total - $completedOrSkipped);
        $days = $remaining * 2;

        return now()->addDays($days)->format('d M Y');
    }

    /**
     * Helper to normalize status strings.
     */
    private function normalizeStatus(mixed $status): string
    {
        if (is_object($status)) {
            return strtoupper($status->value ?? (string) $status);
        }
        return strtoupper((string) $status);
    }

    /**
     * Customer Dashboard
     */
    public function index(Request $request): Response
    {
        $customer = $this->getCustomer($request);

        // Calculate Real-time Stats
        $totalShipments = ShippingSession::where('customer_id', $customer->id)->count();

        $activeShipments = ShippingSession::where('customer_id', $customer->id)
            ->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT'])
            ->count();

        $inTransit = ShippingSession::where('customer_id', $customer->id)
            ->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT'])
            ->whereNotNull('current_checkpoint_id')
            ->count();

        $completedLast7d = ShippingSession::where('customer_id', $customer->id)
            ->whereIn('status', ['COMPLETED', 'completed', 'delivered', 'DELIVERED'])
            ->where('updated_at', '>=', now()->subDays(7))
            ->count();

        $totalCargoTonnage = (float) ShippingSession::where('customer_id', $customer->id)
            ->whereNotIn('status', ['CANCELLED', 'cancelled'])
            ->sum('total_quantity');

        $stats = [
            'total_shipments'     => $totalShipments,
            'active_shipments'    => $activeShipments,
            'in_transit'          => $inTransit,
            'completed_last_7d'   => $completedLast7d,
            'total_cargo_tonnage' => $totalCargoTonnage,
        ];

        // 5 Recent Shipments
        $sessions = ShippingSession::with([
            'customer',
            'currentCheckpoint',
            'sessionCheckpoints.checkpoint',
            'units',
        ])
            ->where('customer_id', $customer->id)
            ->latest()
            ->take(5)
            ->get();

        $recentShipments = $sessions->map(function ($s) {
            return [
                'id'                 => (string) $s->id,
                'assignment_no'      => (string) $s->assignment_no,
                'cargo_name'         => (string) $s->cargo_name,
                'origin'             => (string) ($s->origin ?? '-'),
                'destination'        => (string) ($s->destination ?? '-'),
                'status'             => $this->normalizeStatus($s->status),
                'quantity'           => (float) ($s->total_quantity ?? 0),
                'unit'               => (string) ($s->unit ?? 'MT'),
                'current_checkpoint' => $s->currentCheckpoint?->name ?? 'Belum ditentukan',
                'progress_percent'   => $this->calculateProgress($s),
                'eta'                => $this->estimateEta($s),
                'units'              => $s->units->map(fn ($u) => [
                    'name' => (string) $u->unit_name,
                    'qty'  => (int) $u->quantity,
                ])->values()->toArray(),
            ];
        })->toArray();

        // Checkpoint Groups Overview
        $checkpointGroups = Checkpoint::with([
            'shippingSessions' => fn ($q) => $q->where('customer_id', $customer->id)
                ->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT']),
        ])
            ->orderBy('sequence')
            ->get()
            ->map(function ($cp) {
                return [
                    'id'            => (int) $cp->id,
                    'name'          => (string) $cp->name,
                    'sequence'      => (int) $cp->sequence,
                    'active_fleets' => (int) $cp->shippingSessions->count(),
                    'shipments'     => $cp->shippingSessions->take(3)->map(fn ($ss) => [
                        'id'            => (string) $ss->id,
                        'assignment_no' => (string) $ss->assignment_no,
                        'cargo_name'    => (string) $ss->cargo_name,
                    ])->values()->toArray(),
                ];
            })->toArray();

        return Inertia::render('Customer/Dashboard', [
            'customer' => [
                'id'           => (string) $customer->id,
                'company_name' => (string) $customer->company_name,
                'pic_name'     => $customer->pic_name,
            ],
            'stats'            => $stats,
            'recentShipments'  => $recentShipments,
            'checkpointGroups' => $checkpointGroups,
        ]);
    }

    /**
     * Customer Cargo Monitoring
     */
    public function monitoring(Request $request): Response
    {
        $customer = $this->getCustomer($request);

        $query = ShippingSession::with([
            'currentCheckpoint',
            'sessionCheckpoints.checkpoint',
            'units',
        ])->where('customer_id', $customer->id);

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $statusInput = strtolower((string) $request->status);
            if ($statusInput === 'in_progress') {
                $query->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT']);
            } elseif ($statusInput === 'completed') {
                $query->whereIn('status', ['COMPLETED', 'completed', 'delivered', 'DELIVERED']);
            } elseif ($statusInput === 'draft') {
                $query->whereIn('status', ['DRAFT', 'draft', 'pending', 'PENDING']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Search Filter
        if ($request->filled('search')) {
            $search = '%' . trim((string) $request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('assignment_no', 'ILIKE', $search)
                    ->orWhere('cargo_name', 'ILIKE', $search)
                    ->orWhere('origin', 'ILIKE', $search)
                    ->orWhere('destination', 'ILIKE', $search);
            });
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        $paginated->through(function ($s) {
            return [
                'id'                 => (string) $s->id,
                'assignment_no'      => (string) $s->assignment_no,
                'cargo_name'         => (string) $s->cargo_name,
                'origin'             => (string) ($s->origin ?? '-'),
                'destination'        => (string) ($s->destination ?? '-'),
                'status'             => $this->normalizeStatus($s->status),
                'quantity'           => (float) ($s->total_quantity ?? 0),
                'unit'               => (string) ($s->unit ?? 'MT'),
                'current_checkpoint' => $s->currentCheckpoint?->name ?? 'Belum terdeteksi',
                'progress_percent'   => $this->calculateProgress($s),
                'eta'                => $this->estimateEta($s),
                'created_at'         => $s->created_at ? $s->created_at->format('d M Y') : '-',
                'units'              => $s->units->map(fn ($u) => [
                    'name' => (string) $u->unit_name,
                    'qty'  => (int) $u->quantity,
                ])->values()->toArray(),
            ];
        });

        return Inertia::render('Customer/MonitoringBarang', [
            'shipments' => $paginated,
            'filters'   => [
                'search' => (string) ($request->search ?? ''),
                'status' => (string) ($request->status ?? 'all'),
            ],
        ]);
    }

    /**
     * Checkpoint Overview Page
     */
    public function checkpoints(Request $request): Response
    {
        $customer = $this->getCustomer($request);

        $checkpointGroups = Checkpoint::with([
            'shippingSessions' => fn ($q) => $q->where('customer_id', $customer->id)
                ->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT']),
        ])
            ->orderBy('sequence')
            ->get()
            ->map(function ($cp) {
                return [
                    'id'            => (int) $cp->id,
                    'name'          => (string) $cp->name,
                    'sequence'      => (int) $cp->sequence,
                    'active_fleets' => (int) $cp->shippingSessions->count(),
                    'shipments'     => $cp->shippingSessions->map(fn ($ss) => [
                        'id'             => (string) $ss->id,
                        'assignment_no'  => (string) $ss->assignment_no,
                        'cargo_name'     => (string) $ss->cargo_name,
                        'total_quantity' => (float) $ss->total_quantity,
                        'unit'           => (string) $ss->unit,
                        'origin'         => (string) ($ss->origin ?? '-'),
                        'destination'    => (string) ($ss->destination ?? '-'),
                        'status_label'   => 'Dalam Perjalanan',
                    ])->values()->toArray(),
                ];
            })->toArray();

        $totalInTransit = ShippingSession::where('customer_id', $customer->id)
            ->whereIn('status', ['IN_PROGRESS', 'in_transit', 'IN_TRANSIT'])
            ->count();

        return Inertia::render('Customer/Checkpoint', [
            'checkpoints'      => $checkpointGroups,
            'total_in_transit' => $totalInTransit,
        ]);
    }

    /**
     * Shipment Detail Page
     */
    public function detail(Request $request, string $id): Response
    {
        $this->getCustomer($request);

        $session = ShippingSession::with([
            'customer',
            'currentCheckpoint',
            'sessionCheckpoints.checkpoint',
            'sessionCheckpoints.picUser',
            'units',
            'documents.documentType',
            'documents.uploadedBy',
            'documents.verifiedBy',
        ])->findOrFail($id);

        $this->authorize('view', $session);

        // Dokumen: HANYA yang VERIFIED / APPROVED
        $verifiedDocs = $session->documents->filter(function ($doc) {
            $statusVal = is_object($doc->status) ? ($doc->status->value ?? (string) $doc->status) : (string) $doc->status;
            return in_array(strtoupper((string) $statusVal), ['VERIFIED', 'APPROVED'], true);
        })->map(function ($doc) {
            return [
                'id'                 => (string) $doc->id,
                'file_name'          => (string) $doc->file_name,
                'file_path'          => (string) $doc->file_path,
                'document_type'      => (string) ($doc->documentType?->name ?? 'Dokumen'),
                'document_type_code' => (string) ($doc->documentType?->name ?? 'DOC'),
                'verified_at'        => $doc->verified_at ? $doc->verified_at->format('d M Y H:i') : '-',
                'verified_by'        => (string) ($doc->verifiedBy?->name ?? 'Supervisor GTD'),
                'remarks'            => $doc->remarks,
            ];
        })->values()->toArray();

        // Timeline: Sorted by checkpoint sequence
        $sortedCheckpoints = $session->sessionCheckpoints->sortBy(fn ($sc) => $sc->checkpoint?->sequence ?? 0);

        $timeline = $sortedCheckpoints->map(function ($sc) {
            return [
                'checkpoint_name' => (string) ($sc->checkpoint?->name ?? 'Pos Operasional'),
                'sequence'        => (int) ($sc->checkpoint?->sequence ?? 0),
                'status'          => $this->normalizeStatus($sc->status),
                'actual_start'    => $sc->actual_start ? $sc->actual_start->format('d M Y H:i') : null,
                'actual_finish'   => $sc->actual_finish ? $sc->actual_finish->format('d M Y H:i') : null,
                'pic_name'        => $sc->picUser?->name,
            ];
        })->values()->toArray();

        // Units
        $units = $session->units->map(function ($u) {
            return [
                'unit_name' => (string) $u->unit_name,
                'quantity'  => (int) $u->quantity,
                'notes'     => $u->notes,
            ];
        })->values()->toArray();

        // Shipment Payload
        $shipmentPayload = [
            'id'                 => (string) $session->id,
            'assignment_no'      => (string) $session->assignment_no,
            'cargo_name'         => (string) $session->cargo_name,
            'total_quantity'     => (float) $session->total_quantity,
            'unit'               => (string) ($session->unit ?? 'MT'),
            'origin'             => (string) ($session->origin ?? '-'),
            'destination'        => (string) ($session->destination ?? '-'),
            'status'             => $this->normalizeStatus($session->status),
            'notes'              => $session->notes,
            'created_at'         => $session->created_at ? $session->created_at->format('d M Y') : '-',
            'progress_percent'   => $this->calculateProgress($session),
            'eta'                => $this->estimateEta($session),
            'current_checkpoint' => $session->currentCheckpoint?->name ?? 'Pos Operasional GTD',
        ];

        return Inertia::render('Customer/DetailShipment', [
            'shipment'  => $shipmentPayload,
            'units'     => $units,
            'timeline'  => $timeline,
            'documents' => $verifiedDocs,
        ]);
    }
}
