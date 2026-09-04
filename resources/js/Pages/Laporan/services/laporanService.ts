import type { ExportFormat, ExportResult } from '../types/laporan';

/**
 * Real export service connected to Laravel /laporan/export endpoint.
 */
export const laporanService = {
    async export(
        format: ExportFormat,
        dateFrom: string,
        dateTo: string,
        onProgress: (pct: number) => void,
    ): Promise<ExportResult> {
        onProgress(20);

        const params = new URLSearchParams({
            format,
            date_from: dateFrom,
            date_to: dateTo,
        });

        const url = `/laporan/export?${params.toString()}`;

        onProgress(50);
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'text/csv, application/json',
                },
            });

            if (!response.ok) {
                // Fallback to direct navigation download
                window.location.href = url;
                onProgress(100);
                return {
                    fileName: `GTD_Laporan_Pengiriman_${dateFrom}_sd_${dateTo}.csv`,
                    fileSize: 'CSV Spreadsheet',
                    downloadUrl: url,
                };
            }

            onProgress(80);
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let fileName = `GTD_Laporan_Pengiriman_${dateFrom}_sd_${dateTo}.csv`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    fileName = match[1];
                }
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Auto trigger download in browser
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            onProgress(100);

            const sizeKb = (blob.size / 1024).toFixed(1);
            const fileSize = blob.size > 1024 * 1024
                ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
                : `${sizeKb} KB`;

            return {
                fileName,
                fileSize,
                downloadUrl,
            };
        } catch {
            // Direct download fallback
            window.location.href = url;
            onProgress(100);
            return {
                fileName: `GTD_Laporan_Pengiriman_${dateFrom}_sd_${dateTo}.csv`,
                fileSize: 'CSV Spreadsheet',
                downloadUrl: url,
            };
        }
    },
};
