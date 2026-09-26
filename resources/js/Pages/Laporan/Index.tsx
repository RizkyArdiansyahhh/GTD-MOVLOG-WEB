import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader } from '@/Components/ui';
import { useLaporan } from './hooks/useLaporan';
import { DateRangeCard, FileFormatCard } from './components/ExportOptionsCards';
import { DownloadHistoryTable } from './components/DownloadHistoryTable';
import { ExportSummary } from './components/ExportSummary';
import { ExportProcessing, ExportSuccess } from './components/ExportStatusScreens';
import { PreviewSummary } from './components/PreviewSummary';
import type { CustomerOption, StatusOption } from './types/laporan';

interface Props {
    customers?: CustomerOption[];
    statuses?: StatusOption[];
}

const AlertError: React.FC<{ message: string }> = ({ message }) => (
    <div
        style={{
            background: '#FFF5F5',
            border: '1px solid #FED7D7',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#C53030',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        }}
    >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        {message}
    </div>
);

export default function LaporanIndex({ customers = [], statuses = [] }: Props) {
    const {
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
    } = useLaporan();

    const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));
    const customerLabel = selectedCustomer ? selectedCustomer.company_name : undefined;

    const selectedStatusObj = statuses.find((s) => s.value === statusFilter);
    const statusLabel = selectedStatusObj ? selectedStatusObj.label : undefined;

    /* ── Processing State ─────────────────────────────── */
    if (exportStatus === 'processing') {
        return (
            <DashboardLayout title="Reports">
                <Head title="Reports" />
                <div style={{ padding: 24, background: '#F5F7FA', minHeight: '100%' }}>
                    <ExportProcessing
                        progress={progress}
                        reportType="Shipment Report"
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
            <DashboardLayout title="Reports">
                <Head title="Reports" />
                <div style={{ padding: 24, background: '#F5F7FA', minHeight: '100%' }}>
                    <ExportSuccess
                        result={exportResult}
                        periodLabel={periodLabel}
                        formatLabel={formatLabel}
                        totalSessions={exportResult.totalSessions ?? summary?.total_sessions}
                        onReset={handleReset}
                    />
                </div>
            </DashboardLayout>
        );
    }

    /* ── Idle State (Main Page) ───────────────────────── */
    return (
        <DashboardLayout title="Reports">
            <Head title="Reports" />

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    boxSizing: 'border-box',
                }}
            >
                <PageHeader
                    title="Reports"
                    subtitle="Create and download operational shipment reports"
                />

                {/* Export error banner */}
                {exportError && <AlertError message={exportError} />}

                {/* 2-Column Layout */}
                <div
                    className="laporan-grid"
                    style={{
                        display: 'flex',
                        gap: 24,
                        alignItems: 'flex-start',
                    }}
                >
                    {/* Left Column — 70% */}
                    <div
                        className="laporan-left"
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
                            customers={customers}
                            statuses={statuses}
                            customerId={customerId}
                            statusFilter={statusFilter}
                            onPresetChange={handlePresetChange}
                            onDateChange={handleDateRangeChange}
                            onCustomerChange={setCustomerId}
                            onStatusChange={setStatusFilter}
                        />

                        <FileFormatCard
                            selectedFormat={selectedFormat}
                            onFormatChange={setSelectedFormat}
                        />

                        {/* Preview Error */}
                        {previewError && <AlertError message={previewError} />}

                        {/* Preview Summary Panel */}
                        {summary && <PreviewSummary summary={summary} />}

                        {/* Download History Table */}
                        <DownloadHistoryTable items={downloadHistory} />
                    </div>

                    {/* Right Column — 30% sticky */}
                    <div
                        className="laporan-right"
                        style={{
                            flex: '0 0 calc(30% - 24px)',
                            maxWidth: 'calc(30% - 24px)',
                            position: 'sticky',
                            top: 24,
                        }}
                    >
                        <ExportSummary
                            reportType="Shipment Report"
                            periodLabel={periodLabel}
                            formatLabel={formatLabel}
                            customerLabel={customerLabel}
                            statusLabel={statusLabel}
                            isLoadingPreview={exportStatus === 'loading_preview'}
                            onExport={handleExport}
                            onPreview={handlePreview}
                        />
                    </div>
                </div>

                {/* Responsive overrides via style tag */}
                <style dangerouslySetInnerHTML={{
                    __html: `
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
                    `
                }} />
            </div>
        </DashboardLayout>
    );
}
