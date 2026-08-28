import { useState, useCallback } from 'react';
import type { DateRange, DateRangePreset, ExportFormat, ExportResult, ExportStatus } from '../types/laporan';
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
    const f = new Date(from).toLocaleDateString('id-ID', opts);
    const t = new Date(to).toLocaleDateString('id-ID', opts);
    return `${f} – ${t}`;
}

export function useLaporan() {
    const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('thisMonth');
    const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDates('thisMonth'));
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
    const [progress, setProgress] = useState<number>(0);
    const [exportResult, setExportResult] = useState<ExportResult | null>(null);

    const handlePresetChange = useCallback((preset: DateRangePreset) => {
        setSelectedPreset(preset);
        setDateRange(getPresetDates(preset));
    }, []);

    const handleDateRangeChange = useCallback((field: keyof DateRange, value: string) => {
        setSelectedPreset('custom' as DateRangePreset);
        setDateRange((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleExport = useCallback(async () => {
        setExportStatus('processing');
        setProgress(0);
        setExportResult(null);

        try {
            const result = await laporanService.export(
                selectedFormat,
                dateRange.from,
                dateRange.to,
                (pct) => setProgress(pct),
            );
            setExportResult(result);
            setExportStatus('done');
        } catch {
            setExportStatus('idle');
        }
    }, [selectedFormat, dateRange]);

    const handleCancel = useCallback(() => {
        setExportStatus('idle');
        setProgress(0);
    }, []);

    const handleReset = useCallback(() => {
        setExportStatus('idle');
        setProgress(0);
        setExportResult(null);
    }, []);

    const periodLabel = formatPeriodLabel(dateRange.from, dateRange.to);
    const formatLabel = selectedFormat === 'pdf' ? 'PDF' : 'Excel / CSV';

    return {
        selectedPreset,
        dateRange,
        selectedFormat,
        exportStatus,
        progress,
        exportResult,
        periodLabel,
        formatLabel,
        handlePresetChange,
        handleDateRangeChange,
        handleExport,
        handleCancel,
        handleReset,
        setSelectedFormat,
    };
}
