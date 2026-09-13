import { useState, useCallback, useEffect } from 'react';
import type {
    DateRange,
    DateRangePreset,
    DownloadHistoryItem,
    ExportFormat,
    ExportResult,
    ExportStatus,
    ReportSummary,
} from '../types/laporan';
import { laporanService } from '../services/laporanService';

function getPresetDates(preset: DateRangePreset): DateRange {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, n: number) => {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    };

    switch (preset) {
        case '7days':
            return { from: fmt(addDays(today, -6)), to: fmt(today) };
        case 'thisMonth': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: fmt(start), to: fmt(today) };
        }
        case 'lastQuarter': {
            const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
            return { from: fmt(start), to: fmt(today) };
        }
        default:
            return { from: fmt(addDays(today, -6)), to: fmt(today) };
    }
}

function formatPeriodLabel(from: string, to: string): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const f = new Date(from + 'T00:00:00').toLocaleDateString('id-ID', opts);
    const t = new Date(to + 'T00:00:00').toLocaleDateString('id-ID', opts);
    return `${f} \u2013 ${t}`;
}

export function useLaporan() {
    const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('thisMonth');
    const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDates('thisMonth'));
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [customerId, setCustomerId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
    const [progress, setProgress] = useState<number>(0);
    const [exportResult, setExportResult] = useState<ExportResult | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);

    const refreshHistory = useCallback(async () => {
        setDownloadHistory(await laporanService.history());
    }, []);

    // Load persisted export history on mount (survives page refresh).
    useEffect(() => {
        void refreshHistory();
    }, [refreshHistory]);

    const handlePresetChange = useCallback((preset: DateRangePreset) => {
        setSelectedPreset(preset);
        setDateRange(getPresetDates(preset));
    }, []);

    const handleDateRangeChange = useCallback((field: keyof DateRange, value: string) => {
        setSelectedPreset('custom' as DateRangePreset);
        setDateRange((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handlePreview = useCallback(async () => {
        setExportStatus('loading_preview');
        setSummary(null);
        setPreviewError(null);
        try {
            const result = await laporanService.preview({
                start_date: dateRange.from,
                end_date: dateRange.to,
                ...(customerId ? { customer_id: customerId } : {}),
                ...(statusFilter ? { status: statusFilter } : {}),
            });
            setSummary(result);
            setExportStatus('idle');
        } catch (err: unknown) {
            setPreviewError(err instanceof Error ? err.message : 'Failed to load preview.');
            setExportStatus('idle');
        }
    }, [dateRange, customerId, statusFilter]);

    const handleExport = useCallback(async () => {
        setExportStatus('processing');
        setProgress(0);
        setExportResult(null);
        setExportError(null);

        try {
            const result = await laporanService.export(
                selectedFormat,
                dateRange.from,
                dateRange.to,
                customerId || undefined,
                statusFilter || undefined,
                (pct) => setProgress(pct),
            );
            setExportResult(result);
            // Re-read server history only after a successful export —
            // failures leave history untouched.
            await refreshHistory();
            setExportStatus('done');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
            setExportError(msg);
            setExportStatus('idle');
        }
    }, [selectedFormat, dateRange, customerId, statusFilter, refreshHistory]);

    const handleCancel = useCallback(() => {
        setExportStatus('idle');
        setProgress(0);
    }, []);

    const handleReset = useCallback(() => {
        setExportStatus('idle');
        setProgress(0);
        setExportResult(null);
        setExportError(null);
    }, []);

    const periodLabel = formatPeriodLabel(dateRange.from, dateRange.to);
    const formatLabel = selectedFormat === 'pdf' ? 'PDF' : 'Excel (.xlsx)';

    return {
        selectedPreset,
        dateRange,
        selectedFormat,
        customerId,
        statusFilter,
        exportStatus,
        progress,
        exportResult,
        exportError,
        summary,
        previewError,
        downloadHistory,
        refreshHistory,
        periodLabel,
        formatLabel,
        handlePresetChange,
        handleDateRangeChange,
        handlePreview,
        handleExport,
        handleCancel,
        handleReset,
        setSelectedFormat,
        setCustomerId,
        setStatusFilter,
    };
}
