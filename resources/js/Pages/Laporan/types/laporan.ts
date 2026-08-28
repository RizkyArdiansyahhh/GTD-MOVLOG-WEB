export type ExportFormat = 'pdf' | 'excel';

export type ExportStatus = 'idle' | 'processing' | 'done';

export type DateRangePreset = '7days' | 'thisMonth' | 'lastQuarter' | 'custom';

export type QuickFilterType = '7_hari' | 'bulan_ini' | 'kuartal_terakhir' | 'custom';

export type DownloadStatus = 'ready' | 'expired' | 'processing' | 'Siap Unduh' | 'Kedaluwarsa';

export interface FileFormatOption {
    id: ExportFormat;
    name: string;
    subLabel: string;
    description: string;
    iconType: 'pdf' | 'excel';
}

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
