<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ShippingSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Laporan/Laporan');
    }

    /**
     * Export operational shipping sessions and checkpoint progression to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
            'format'    => ['nullable', 'string', 'in:csv,xlsx,pdf'],
        ]);

        $query = ShippingSession::with([
            'customer:id,company_name',
            'currentCheckpoint:id,name',
            'sessionCheckpoints' => function ($q) {
                $q->with(['checkpoint', 'picUser:id,name', 'reports']);
            },
        ])->latest('created_at');

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sessions = $query->get();

        $fileName = 'GTD_Laporan_Pengiriman_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->streamDownload(function () use ($sessions) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // CSV Header
            fputcsv($handle, [
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
                'Tahap 1 (Kapal)',
                'Tahap 2 (Tongkang)',
                'Tahap 3 (Pelabuhan)',
                'Tahap 4 (Site)',
                'Tanggal Dibuat',
            ]);

            foreach ($sessions as $index => $session) {
                $checkpoints = $session->sessionCheckpoints->sortBy('checkpoint.sequence')->values();

                $cpStatuses = [];
                for ($i = 0; $i < 4; $i++) {
                    $cp = $checkpoints->get($i);
                    if ($cp) {
                        $statusStr = is_object($cp->status) ? ($cp->status->value ?? (string) $cp->status) : (string) $cp->status;
                        $pic = $cp->picUser ? " (PIC: {$cp->picUser->name})" : '';
                        $cpStatuses[] = strtoupper($statusStr) . $pic;
                    } else {
                        $cpStatuses[] = '-';
                    }
                }

                $sessionStatus = is_object($session->status) ? ($session->status->value ?? (string) $session->status) : (string) $session->status;

                fputcsv($handle, [
                    $index + 1,
                    $session->assignment_no ?? (string) $session->id,
                    $session->customer?->company_name ?? '-',
                    $session->cargo_name ?? '-',
                    $session->total_quantity ?? 0,
                    $session->unit ?? 'unit',
                    $session->origin ?? '-',
                    $session->destination ?? '-',
                    strtoupper($sessionStatus),
                    $session->currentCheckpoint?->name ?? '-',
                    $cpStatuses[0] ?? '-',
                    $cpStatuses[1] ?? '-',
                    $cpStatuses[2] ?? '-',
                    $cpStatuses[3] ?? '-',
                    $session->created_at?->format('Y-m-d H:i:s') ?? '-',
                ]);
            }

            fclose($handle);
        }, $fileName, $headers);
    }
}

