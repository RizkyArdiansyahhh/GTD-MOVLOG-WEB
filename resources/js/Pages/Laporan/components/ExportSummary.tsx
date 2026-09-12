import React from 'react';

interface ExportSummaryProps {
    reportType: string;
    periodLabel: string;
    formatLabel: string;
    customerLabel?: string;
    statusLabel?: string;
    isLoadingPreview?: boolean;
    isExporting?: boolean;
    onExport: () => void;
    onPreview?: () => void;
}

export const ExportSummary: React.FC<ExportSummaryProps> = ({
    reportType,
    periodLabel,
    formatLabel,
    customerLabel,
    statusLabel,
    isLoadingPreview = false,
    isExporting = false,
    onExport,
    onPreview,
}) => {
    const fields = [
        { label: 'Report', value: reportType },
        { label: 'Period', value: periodLabel },
        { label: 'Format', value: formatLabel },
        ...(customerLabel ? [{ label: 'Customer', value: customerLabel }] : []),
        ...(statusLabel ? [{ label: 'Status', value: statusLabel }] : []),
    ];

    return (
        <div
            style={{
                background: 'linear-gradient(145deg, #B7791F 0%, #D69E2E 100%)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
                minHeight: 340,
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 17,
                    color: '#fff',
                    margin: 0,
                }}>
                    Export Summary
                </h3>
                <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.4)', borderRadius: 2, marginTop: 8 }} />
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                {fields.map(({ label, value }) => (
                    <div key={label}>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0, marginBottom: 4, fontWeight: 500 }}>
                            {label}
                        </p>
                        <p style={{ fontSize: 13, color: '#fff', margin: 0, fontWeight: 600 }}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '20px 0' }} />

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {onPreview && (
                    <button
                        type="button"
                        onClick={onPreview}
                        disabled={isLoadingPreview || isExporting}
                        style={{
                            width: '100%',
                            height: 42,
                            borderRadius: 10,
                            border: '1.5px solid rgba(255, 255, 255, 0.7)',
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: (isLoadingPreview || isExporting) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {isLoadingPreview ? (
                            'MEMUAT PREVIEW...'
                        ) : (
                            <>
                                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                PREVIEW SUMMARY
                            </>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onExport}
                    disabled={isExporting}
                    style={{
                        width: '100%',
                        height: 48,
                        borderRadius: 10,
                        border: 'none',
                        background: '#06283A',
                        color: '#fff',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: isExporting ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.03em',
                        transition: 'opacity 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                    }}
                    onMouseEnter={(e) => { if (!isExporting) e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                    {isExporting ? 'MENYIAPKAN EKSPOR...' : 'EXPORT REPORT NOW'}
                </button>
            </div>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 12, marginBottom: 0 }}>
                Average processing time ~ 12 seconds
            </p>
        </div>
    );
};
