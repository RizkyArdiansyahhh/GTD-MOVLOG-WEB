import axios from 'axios';
import type { DownloadHistoryItem, ExportFormat, ExportResult, ReportFilters, ReportSummary } from '../types/laporan';

/**
 * Extract a backend error message from an axios failure.
 * Export endpoint returns a blob, so a validation error body may arrive
 * as a Blob containing JSON — callers pass the raw payload here.
 */
async function resolveErrorMessage(payload: unknown, fallback: string): Promise<string> {
    try {
        if (payload instanceof Blob) {
            const text = await payload.text();
            const parsed = JSON.parse(text) as { message?: string };
            if (typeof parsed.message === 'string' && parsed.message.length > 0) {
                return parsed.message;
            }
            return fallback;
        }
        if (typeof payload === 'object' && payload !== null) {
            const msg = (payload as { message?: unknown }).message;
            if (typeof msg === 'string' && msg.length > 0) {
                return msg;
            }
        }
    } catch {
        // fall through to fallback message
    }
    return fallback;
}

/**
 * Laporan service — communicates with Laravel POST endpoints.
 *
 * Uses the shared axios instance configured in `bootstrap.js`
 * (`withXSRFToken: true`, reads the fresh `XSRF-TOKEN` cookie).
 * This avoids the stale `<meta name="csrf-token">` problem that caused
 * 419 errors after login session regeneration in an Inertia SPA.
 */
export const laporanService = {
    /**
     * Fetch a preview summary (JSON) without triggering a file download.
     */
    async preview(filters: Omit<ReportFilters, 'format'>): Promise<ReportSummary> {
        try {
            // format is required by the FormRequest; pass 'pdf' as default for preview
            const response = await axios.post<ReportSummary>('/laporan/preview', {
                ...filters,
                format: 'pdf',
            });
            return response.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                throw new Error(
                    await resolveErrorMessage(err.response?.data, 'Gagal mengambil preview laporan.'),
                );
            }
            throw err;
        }
    },

    /**
     * Trigger an export (PDF or Excel) and auto-download the resulting file.
     */
    async export(
        format: ExportFormat,
        dateFrom: string,
        dateTo: string,
        customerId: string | undefined,
        status: string | undefined,
        onProgress: (pct: number) => void,
        search?: string,
    ): Promise<ExportResult> {
        onProgress(20);

        const body: ReportFilters = {
            format,
            start_date: dateFrom,
            end_date: dateTo,
            ...(customerId ? { customer_id: customerId } : {}),
            ...(status ? { status } : {}),
            ...(search ? { search } : {}),
        };

        onProgress(50);

        try {
            const response = await axios.post<Blob>('/laporan/export', body, {
                responseType: 'blob',
            });

            onProgress(80);
            const blob: Blob = response.data;
            const contentDisposition =
                response.headers['content-disposition'] ?? response.headers['Content-Disposition'] ?? '';
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            const ext = format === 'pdf' ? '.pdf' : '.xlsx';
            const fileName = match?.[1]?.replace(/['"]/g, '') ?? `GTD_Laporan_${dateFrom}_sd_${dateTo}${ext}`;

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Delay revocation so asynchronous download stream and manual download button work reliably
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 60000);

            onProgress(100);

            const sizeKb = (blob.size / 1024).toFixed(1);
            const fileSize = blob.size > 1024 * 1024
                ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
                : `${sizeKb} KB`;

            return { fileName, fileSize, downloadUrl };
        } catch (err: unknown) {
            onProgress(0);
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const fallback =
                    status !== undefined
                        ? `Export gagal dengan status ${status}`
                        : 'Export gagal. Silakan coba lagi.';
                throw new Error(await resolveErrorMessage(err.response?.data, fallback));
            }
            throw err;
        }
    },

    /**
     * Fetch the authenticated user's export history (newest first).
     * Never throws — history must not break the page when unavailable.
     */
    async history(): Promise<DownloadHistoryItem[]> {
        try {
            const response = await axios.get<DownloadHistoryItem[]>('/laporan/history');
            return Array.isArray(response.data) ? response.data : [];
        } catch {
            return [];
        }
    },
};
