import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useLaporan } from './hooks/useLaporan';
import { DateRangeCard, FileFormatCard } from './components/ExportOptionsCards';
import { DownloadHistoryTable } from './components/DownloadHistoryTable';
import { ExportSummary } from './components/ExportSummary';
import { ExportProcessing, ExportSuccess } from './components/ExportStatusScreens';

export default function Laporan() {
    const {
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
    } = useLaporan();

    /* ── Processing State ─────────────────────────────── */
    if (exportStatus === 'processing') {
        return (
            <DashboardLayout title="Laporan">
                <Head title="Laporan" />
                <div style={{ padding: 24, background: '#F5F7FA', minHeight: '100%' }}>
                    <ExportProcessing
                        progress={progress}
                        reportType="Laporan Pengiriman"
                        periodLabel={periodLabel}
                        formatLabel={formatLabel}
                        onCancel={handleCancel}
                    />
                </div>
            </DashboardLayout>
        );
    }

    /* ── Done State ───────────────────────────────────── */
    if (exportStatus === 'done' && exportResult) {
        return (
            <DashboardLayout title="Laporan">
                <Head title="Laporan" />
                <div style={{ padding: 24, background: '#F5F7FA', minHeight: '100%' }}>
                    <ExportSuccess
                        result={exportResult}
                        periodLabel={periodLabel}
                        onReset={handleReset}
                    />
                </div>
            </DashboardLayout>
        );
    }

    /* ── Idle State (Main Page) ───────────────────────── */
    return (
        <DashboardLayout title="Laporan">
            <Head title="Laporan" />

            <div
                style={{
                    padding: 24,
                    background: '#F5F7FA',
                    minHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    boxSizing: 'border-box',
                }}
            >
                {/* Page Header */}
                <div>
                    <h1
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: 32,
                            color: '#06283A',
                            margin: 0,
                        }}
                    >
                        Laporan
                    </h1>
                </div>

                {/* 2-Column Layout */}
                <div
                    style={{
                        display: 'flex',
                        gap: 24,
                        alignItems: 'flex-start',
                    }}
                >
                    {/* Left Column — 70% */}
                    <div
                        style={{
                            flex: '0 0 70%',
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                        }}
                    >
                        <DateRangeCard
                            selectedPreset={selectedPreset}
                            dateRange={dateRange}
                            onPresetChange={handlePresetChange}
                            onDateChange={handleDateRangeChange}
                        />

                        <FileFormatCard
                            selectedFormat={selectedFormat}
                            onFormatChange={setSelectedFormat}
                        />

                        <DownloadHistoryTable />
                    </div>

                    {/* Right Column — 30% */}
                    <div
                        style={{
                            flex: '0 0 calc(30% - 24px)',
                            maxWidth: 'calc(30% - 24px)',
                            position: 'sticky',
                            top: 24,
                        }}
                    >
                        <ExportSummary
                            reportType="Laporan Pengiriman"
                            periodLabel={periodLabel}
                            formatLabel={formatLabel}
                            onExport={handleExport}
                        />
                    </div>
                </div>

                {/* Responsive overrides via style tag */}
                <style>{`
                    @media (max-width: 1024px) {
                        .laporan-grid {
                            flex-direction: column !important;
                        }
                        .laporan-left {
                            flex: none !important;
                            max-width: 100% !important;
                        }
                        .laporan-right {
                            flex: none !important;
                            max-width: 100% !important;
                            position: static !important;
                        }
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
}