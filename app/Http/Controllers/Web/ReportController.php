<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\ShippingSessionStatus;
use App\Exports\ShipmentReportExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\GenerateReportRequest;
use App\Models\Customer;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Thin web controller for the Laporan page.
 *
 * All report aggregation lives in ReportService; data access lives in
 * the ShippingSession repository. This controller only renders the page,
 * returns the JSON preview, and dispatches to the PDF / Excel exporters.
 */
class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    /**
     * Render the Laporan page with filter options.
     */
    public function index(): Response
    {
        return Inertia::render('Laporan/Index', [
            'customers' => Customer::select('id', 'company_name')->orderBy('company_name')->get(),
            'statuses'  => collect(ShippingSessionStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ])->values(),
        ]);
    }

    /**
     * Return a JSON preview of the summary (AJAX, no download).
     */
    public function preview(GenerateReportRequest $request): JsonResponse
    {
        $summary = $this->reportService->generateSummary($request);

        return response()->json([
            'period'                 => $summary['period'],
            'total_sessions'         => $summary['total_sessions'],
            'status_breakdown'       => $summary['status_breakdown'],
            'checkpoint_breakdown'   => $summary['checkpoint_breakdown'],
            'operational_narrative'  => $summary['operational_narrative'],
            'operational_summary'    => $summary['operational_summary'],
            'operational_highlights' => $summary['operational_highlights'],
            'delivered_count'        => $summary['delivered_count'],
            'in_transit_count'       => $summary['in_transit_count'],
            'generated_by'           => $summary['generated_by'],
            'generated_at'           => $summary['generated_at'],
            // Enriched analytics (Tahap 1). sessions_detail is kept out
            // of the preview payload (available via generateSummary for
            // PDF/Excel); the UI consumes the aggregates below.
            'kpi'                    => $summary['kpi'],
            'stage_durations'        => $summary['stage_durations'],
            'customer_insights'      => $summary['customer_insights'],
            'document_compliance'    => $summary['document_compliance'],
            'exceptions'             => $summary['exceptions'],
            'meta'                   => $summary['meta'],
        ]);
    }

    /**
     * Export the report and trigger a file download.
     */
    public function export(GenerateReportRequest $request): HttpResponse|BinaryFileResponse
    {
        if ($request->validated()['format'] === 'pdf') {
            return $this->exportPdf($request);
        }

        return $this->exportExcel($request);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * The authenticated user's own export history (newest first),
     * shaped for the DownloadHistoryTable UI.
     */
    public function history(): JsonResponse
    {
        $items = Activity::inLog(self::EXPORT_LOG)
            ->causedBy(auth()->user())
            ->latest()
            // created_at has second precision — id breaks ties so the
            // newest export is deterministically first.
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (Activity $activity) => $this->mapHistoryItem($activity))
            ->values();

        return response()->json($items);
    }

    /**
     * Narrative PDF (portrait A4, no tables — divs/paragraphs only).
     * Dompdf Pdf::download() returns Illuminate\Http\Response.
     */
    private function exportPdf(GenerateReportRequest $request): HttpResponse
    {
        $summary = $this->reportService->generateSummary($request);

        $pdf = Pdf::loadView('reports.summary-pdf', ['data' => $summary])
            ->setPaper('a4', 'portrait');

        $filename = 'GTD_Laporan_Pengiriman_' . now()->format('Y-m-d_His') . '.pdf';

        $response = $pdf->download($filename);

        // Logged only after the PDF rendered without exception.
        $this->logExportHistory($request, 'pdf', $filename, $this->responseFileSize($response));

        return $response;
    }

    /**
     * Single-table Excel export streamed via chunked query (chunk 500).
     */
    private function exportExcel(GenerateReportRequest $request): BinaryFileResponse
    {
        $validated = $request->validated();

        $customerId = $validated['customer_id'] ?? null;
        $authUser = auth()->user();
        if ($authUser && ($authUser->customer_id ?? null)) {
            $customerId = $authUser->customer_id;
        }

        $filename = 'GTD_Laporan_Pengiriman_' . now()->format('Y-m-d_His') . '.xlsx';

        $response = Excel::download(
            new ShipmentReportExport(
                $validated['start_date'],
                $validated['end_date'],
                $customerId,
                $validated['status'] ?? null,
                $validated['search'] ?? null,
                $validated['sort_by'] ?? 'created_at',
                $validated['sort_direction'] ?? 'desc',
            ),
            $filename,
        );

        // Logged only after the workbook built without exception.
        $this->logExportHistory($request, 'excel', $filename, $this->responseFileSize($response));

        return $response;
    }

    // -------------------------------------------------------------------------
    // Export history (spatie activitylog — no new table)
    // -------------------------------------------------------------------------

    private const string EXPORT_LOG = 'report-export';

    /**
     * Record one history row per successful export. Every call creates
     * a NEW row (never updateOrCreate) so repeated exports each appear.
     * Validation failures (422) and generation exceptions return/throw
     * before reaching here, so failures never produce history.
     */
    private function logExportHistory(
        GenerateReportRequest $request,
        string $format,
        string $fileName,
        ?int $fileSizeBytes,
    ): void {
        $validated = $request->validated();

        activity(self::EXPORT_LOG)
            ->causedBy($request->user())
            ->event('exported')
            ->withProperties([
                'format'      => $format,
                'file_name'   => $fileName,
                'file_size'   => $fileSizeBytes !== null ? $this->formatBytes($fileSizeBytes) : null,
                'start_date'  => $validated['start_date'] ?? null,
                'end_date'    => $validated['end_date'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'status'      => $validated['status'] ?? null,
                'search'      => $validated['search'] ?? null,
            ])
            ->log("Export laporan {$format} ({$fileName})");
    }

    /**
     * Shape one activity row for the DownloadHistoryTable UI.
     *
     * @return array{id: int, name: string, format: string, createdAt: string, fileSize: string, status: string}
     */
    private function mapHistoryItem(Activity $activity): array
    {
        $props = $activity->properties instanceof \Illuminate\Support\Collection
            ? $activity->properties->toArray()
            : (array) $activity->properties;

        return [
            'id'        => (string) $activity->id,
            'name'      => (string) ($props['file_name'] ?? $activity->description),
            'format'    => (string) ($props['format'] ?? 'pdf'),
            'createdAt' => $activity->created_at?->locale('id')->translatedFormat('d M Y, H:i') ?? '-',
            'fileSize'  => (string) ($props['file_size'] ?? '-'),
            'status'    => 'ready',
        ];
    }

    /**
     * Best-effort file size of an already-built download response.
     */
    private function responseFileSize(HttpResponse|BinaryFileResponse $response): ?int
    {
        try {
            if ($response instanceof BinaryFileResponse && method_exists($response, 'getFile')) {
                $path = $response->getFile()->getPathname();
                if (is_string($path) && is_file($path)) {
                    $size = filesize($path);

                    return $size === false ? null : $size;
                }

                return null;
            }

            $content = $response->getContent();
            if (is_string($content)) {
                return strlen($content);
            }
        } catch (\Throwable) {
            // History must never break the export itself.
        }

        return null;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / (1024 * 1024), 2, '.', '').' MB';
        }

        return number_format(max($bytes, 1) / 1024, 1, '.', '').' KB';
    }
}
