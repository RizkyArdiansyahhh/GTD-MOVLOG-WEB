<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Document;
use App\Models\Report;
use App\Models\SessionCheckpoint;
use App\Models\ShippingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $customer = null;
        if ($user && method_exists($user, 'customer') && $user->customer) {
            $customer = $user->customer;
        } else {
            $customer = Customer::first();
        }

        $company = [
            'id' => $customer?->id ?? 'cust-gtd-01',
            'company_name' => $customer?->company_name ?? ($user?->name ?? 'Sejahtera Jaya'),
            'pic_name' => $customer?->pic_name ?? ($user?->name ?? 'Bpk. Hendra'),
            'email' => $customer?->email ?? ($user?->email ?? 'contact@sejahterajaya.co.id'),
            'phone' => $customer?->phone ?? ($user?->phone ?? '+62 812-8899-7700'),
        ];

        $totalShipments = ShippingSession::count();
        $activeShipments = ShippingSession::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count();
        $inTransitShipments = ShippingSession::whereIn('status', ['IN_PROGRESS', 'DALAM PERJALANAN'])->count();
        $completedShipments = ShippingSession::where('status', 'COMPLETED')->count();
        $totalCargoTonnage = (float) ShippingSession::sum('total_quantity');

        $stats = [
            'total_shipments' => $totalShipments > 0 ? $totalShipments : 18,
            'active_shipments' => $activeShipments > 0 ? $activeShipments : 10,
            'in_transit' => $inTransitShipments > 0 ? $inTransitShipments : 3,
            'completed_shipments' => $completedShipments > 0 ? $completedShipments : 15,
            'total_cargo_tonnage' => $totalCargoTonnage > 0 ? $totalCargoTonnage : 45000,
        ];

        $sessions = ShippingSession::with(['customer', 'currentCheckpoint', 'sessionCheckpoints.checkpoint'])
            ->latest()
            ->take(5)
            ->get();

        if ($sessions->isNotEmpty()) {
            $recentShipments = $sessions->map(function ($s) {
                $statusVal = is_object($s->status) ? ($s->status->value ?? (string) $s->status) : (string) $s->status;
                $statusUpper = strtoupper($statusVal);

                $statusLabel = match ($statusUpper) {
                    'IN_PROGRESS', 'DALAM PERJALANAN' => 'DALAM PERJALANAN',
                    'LOADING', 'DRAFT' => 'LOADING',
                    'COMPLETED' => 'TERKIRIM',
                    default => $statusUpper,
                };

                return [
                    'id' => (string) $s->id,
                    'assignment_no' => $s->assignment_no ?? 'LTR-' . substr((string) $s->id, 0, 5),
                    'cargo_name' => $s->cargo_name ?? 'General Cargo',
                    'total_quantity' => (float) ($s->total_quantity ?? 0),
                    'unit' => $s->unit ?? 'MT',
                    'origin' => $s->origin ?? 'Pelabuhan Merak',
                    'destination' => $s->destination ?? 'Kalimantan Selatan, PT Bara',
                    'status' => $statusUpper,
                    'status_label' => $statusLabel,
                    'current_checkpoint' => $s->currentCheckpoint?->name ?? 'Pos Operasional',
                    'progress_percentage' => 65,
                    'total_checkpoints' => $s->sessionCheckpoints->count(),
                    'completed_checkpoints' => $s->sessionCheckpoints->where('status', 'COMPLETED')->count(),
                    'eta' => $s->updated_at ? $s->updated_at->format('d M Y') : 'Hari ini, 14:00',
                    'updated_at' => $s->updated_at ? $s->updated_at->diffForHumans() : 'Baru saja',
                ];
            })->toArray();
        } else {
            $recentShipments = [
                [
                    'id' => '1',
                    'assignment_no' => 'LTR-88291',
                    'cargo_name' => 'General Cargo',
                    'total_quantity' => 2500,
                    'unit' => 'MT',
                    'origin' => 'Pelabuhan Tanjung Priok',
                    'destination' => 'Kalimantan Selatan, PT Bara',
                    'status' => 'IN_PROGRESS',
                    'status_label' => 'DALAM PERJALANAN',
                    'current_checkpoint' => 'Alur Laut Jawa',
                    'progress_percentage' => 60,
                    'total_checkpoints' => 5,
                    'completed_checkpoints' => 3,
                    'eta' => 'Hari ini, 14:00',
                    'updated_at' => '10 menit yang lalu',
                ],
                [
                    'id' => '2',
                    'assignment_no' => 'LTR-88304',
                    'cargo_name' => 'Heavy Machinery',
                    'total_quantity' => 120,
                    'unit' => 'Unit',
                    'origin' => 'Pelabuhan Merak',
                    'destination' => 'Samarinda (Site Alpha)',
                    'status' => 'LOADING',
                    'status_label' => 'LOADING',
                    'current_checkpoint' => 'Pelabuhan Asal',
                    'progress_percentage' => 20,
                    'total_checkpoints' => 4,
                    'completed_checkpoints' => 1,
                    'eta' => '12 Okt 2023',
                    'updated_at' => '1 jam yang lalu',
                ],
                [
                    'id' => '3',
                    'assignment_no' => 'LTR-88285',
                    'cargo_name' => 'Bulk Cargo',
                    'total_quantity' => 5000,
                    'unit' => 'MT',
                    'origin' => 'Pelabuhan Gresik',
                    'destination' => 'Kalimantan Timur, Jaya Emas',
                    'status' => 'COMPLETED',
                    'status_label' => 'TERKIRIM',
                    'current_checkpoint' => 'Site PLTU Suralaya',
                    'progress_percentage' => 100,
                    'total_checkpoints' => 5,
                    'completed_checkpoints' => 5,
                    'eta' => 'Kemarin, 11:20',
                    'updated_at' => 'Kemarin',
                ],
            ];
        }

        $activities = [
            [
                'id' => 'act-1',
                'title' => 'Manifest Berhasil Diunggah',
                'description' => 'Dokumen pengiriman #LTR-88304 telah diverifikasi oleh admin. Proses pemuatan di pelabuhan asal dapat segera dimulai.',
                'time_ago' => '10 MENIT YANG LALU',
                'type' => 'document',
                'badge_color' => 'yellow',
            ],
            [
                'id' => 'act-2',
                'title' => 'Armada Memasuki Checkpoint 4',
                'description' => 'Unit DT-104 (Barge Titan 2) tiba di Area Transit Pelabuhan Merak. Estimasi keberangkatan menuju tujuan akhir pukul 19:00.',
                'time_ago' => '1 JAM YANG LALU',
                'type' => 'checkpoint',
                'badge_color' => 'blue',
            ],
            [
                'id' => 'act-3',
                'title' => 'Pengiriman Selesai',
                'description' => 'Muatan Batubara 5000MT telah dibongkar di Site PLTU Suralaya. Bukti penyerahan barang (POD) tersedia untuk diunduh.',
                'time_ago' => 'KEMARIN, 16:45',
                'type' => 'complete',
                'badge_color' => 'green',
            ],
        ];

        return Inertia::render('Customer/Dashboard', [
            'company' => $company,
            'stats' => $stats,
            'recent_shipments' => $recentShipments,
            'activities' => $activities,
        ]);
    }
}