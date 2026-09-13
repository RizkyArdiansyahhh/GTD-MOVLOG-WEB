export type ExportFormat = 'pdf' | 'excel';

export type ExportStatus = 'idle' | 'loading_preview' | 'processing' | 'done';

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
    downloadToken: string;
    format?: string;
    totalSessions?: number;
}

/** Filters sent to /laporan/preview and /laporan/export */
export interface ReportFilters {
    start_date: string;
    end_date: string;
    customer_id?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
    format: ExportFormat;
}

/** KPI rollup returned from /laporan/preview (Tahap 1 analytics) */
export interface ReportKpi {
    total_units: number;
    total_quantity: number;
    total_gross_weight_kg: number | null;
    total_net_weight_kg: number | null;
    gross_weight_label: string;
    net_weight_label: string;
    weight_sessions: number;
    commercial_value_by_currency: Record<string, number>;
    commercial_value_label: string;
    commercial_sessions: number;
    avg_lead_time_hours: number | null;
    avg_lead_time_days: number | null;
    completed_lead_time_count: number;
    bottleneck_stage: string | null;
    ciqp_breakdown: Record<string, number>;
}

export interface StageDurationStat {
    avg_hours: number;
    avg_days: number;
    samples: number;
}

export interface CustomerInsight {
    customer_id: string | null;
    company_name: string;
    total_sessions: number;
    delivered: number;
    in_transit: number;
    delivered_ratio: number;
    avg_lead_time_hours: number | null;
    avg_lead_time_days: number | null;
    completed_lead_times: number;
}

export interface StagnantSession {
    session_id: string;
    assignment_no: string;
    customer_name: string;
    stage: string;
    pic?: string | null;
    stuck_days: number;
    since: string;
}

export interface RejectedDocument {
    assignment_no: string;
    customer_name: string;
    document_type: string;
    remarks: string | null;
    verified_by?: string | null;
}

export interface UnverifiedSession {
    assignment_no: string;
    customer_name: string;
    verified: number;
    required: number;
    pending_items: string[];
}

export interface ReportExceptions {
    stagnant: StagnantSession[];
    rejected_documents: RejectedDocument[];
    unverified_sessions: UnverifiedSession[];
}

/** Summary data returned from /laporan/preview */
export interface ReportSummary {
    period: { start: string; end: string };
    total_sessions: number;
    status_breakdown: Record<string, number>;
    checkpoint_breakdown?: Record<string, number>;
    operational_narrative?: string;
    operational_summary?: string;
    operational_highlights?: string[];
    delivered_count?: number;
    in_transit_count?: number;
    generated_by: string;
    generated_at: string;
    kpi?: ReportKpi;
    stage_durations?: Record<string, StageDurationStat>;
    customer_insights?: CustomerInsight[];
    exceptions?: ReportExceptions;
}

export interface CustomerOption {
    id: string;
    company_name: string;
}

export interface StatusOption {
    value: string;
    label: string;
}
