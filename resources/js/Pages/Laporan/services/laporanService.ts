import type { ExportFormat, ExportResult } from '../types/laporan';

/**
 * Mock export service — replace with real Axios/fetch calls to Laravel API.
 */
export const laporanService = {
    /**
     * Simulates an export request.
     * Returns a promise that resolves after ~12 seconds with the file result.
     */
    export(
        _format: ExportFormat,
        _dateFrom: string,
        _dateTo: string,
        onProgress: (pct: number) => void,
    ): Promise<ExportResult> {
        return new Promise((resolve) => {
            const totalMs = 12_000;
            const intervalMs = 200;
            let elapsed = 0;

            const timer = setInterval(() => {
                elapsed += intervalMs;
                const pct = Math.min(Math.round((elapsed / totalMs) * 100), 99);
                onProgress(pct);

                if (elapsed >= totalMs) {
                    clearInterval(timer);
                    onProgress(100);
                    resolve({
                        fileName: `Laporan_Pengiriman_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.${_format === 'pdf' ? 'pdf' : 'xlsx'}`,
                        fileSize: _format === 'pdf' ? '3.2 MB' : '1.4 MB',
                        downloadUrl: '#',
                    });
                }
            }, intervalMs);
        });
    },
};
