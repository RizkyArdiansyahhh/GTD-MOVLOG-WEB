export type ExportFormat = 'pdf' | 'excel';

export type ExportStatus = 'idle' | 'processing' | 'done';

export type DateRangePreset = '7days' | 'thisMonth' | 'lastQuarter' | 'custom';

export type DownloadStatus = 'ready' | 'expired' | 'processing';

export interface DateRange {
    from: string;
    to: string;
}

export interface DownloadHistoryItem {
    id: string;
    name: string;
    format: ExportFormat;
    createdAt: string;
    fileSize: string;
    status: DownloadStatus;
    downloadUrl?: string;
}

export interface ExportSummaryData {
    reportType: string;
    period: string;
    format: string;
}

export interface ExportResult {
    fileName: string;
    fileSize: string;
    downloadUrl: string;
}
