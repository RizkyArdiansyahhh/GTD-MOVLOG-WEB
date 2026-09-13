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
                    await resolveErrorMessage(err.response?.data, 'Failed to fetch report preview.'),
                );
            }
            throw err;
        }
    },

    /**
     * Trigger an export (PDF or Excel). Returns a download token —
     * the file is NOT auto-downloaded; the caller shows a
     * "Ready to Download" state and only downloads on user click.
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
            const response = await axios.post<{
                download_token: string;
                download_url: string;
                file_name: string;
                file_size: string | null;
                format: string;
                total_sessions: number;
            }>('/laporan/export', body);

            onProgress(80);

            const data = response.data;
            const downloadUrl = data.download_url ?? `/laporan/download/${data.download_token}`;

            onProgress(100);

            return {
                fileName: data.file_name,
                fileSize: data.file_size ?? '-',
                downloadUrl,
                downloadToken: data.download_token,
                format: data.format,
                totalSessions: data.total_sessions,
            };
        } catch (err: unknown) {
            onProgress(0);
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const fallback =
                    status !== undefined
                        ? `Export failed with status ${status}`
                        : 'Export failed. Please try again.';
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
