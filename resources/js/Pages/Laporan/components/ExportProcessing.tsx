import React from 'react';

interface ExportProcessingProps {
    progress: number;
    reportType: string;
    periodLabel: string;
    formatLabel: string;
    onCancel: () => void;
}

export const ExportProcessing: React.FC<ExportProcessingProps> = ({
    progress,
    reportType,
    periodLabel,
    formatLabel,
    onCancel,
}) => {
    const secondsLeft = progress >= 100 ? 0 : Math.max(1, Math.round((12 * (100 - progress)) / 100));

    const progressText =
        progress < 30
            ? 'Mengumpulkan data...'
            : progress < 60
                ? 'Memproses data...'
                : progress < 90
                    ? 'Menyusun berkas...'
                    : 'Hampir selesai...';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 24px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 520,
                    background: '#fff',
                    borderRadius: 12,
                    padding: 32,
                    border: '1px solid #E5E7EB',
                }}
            >
                {/* Loading Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            border: '4px solid #FFF4D6',
                            borderTopColor: '#B7791F',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>

                {/* Title */}
                <h2 style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#06283A',
                    textAlign: 'center',
                    margin: 0,
                    marginBottom: 8,
                }}>
                    Laporan Sedang Diproses
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', margin: 0, marginBottom: 28, lineHeight: 1.6 }}>
                    Mohon tunggu sebentar, kami sedang menyusun data logistik Anda.
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: 8 }}>
                    <div style={{
                        height: 8,
                        background: '#F3F4F6',
                        borderRadius: 8,
                        overflow: 'hidden',
                    }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #B7791F, #D69E2E)',
                                borderRadius: 8,
                                transition: 'width 0.2s ease-out',
                            }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{progressText}</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>± {secondsLeft} detik lagi</span>
                </div>

                {/* Summary Mini Card */}
                <div style={{
                    background: '#FFF8EC',
                    borderRadius: 8,
                    padding: '14px 16px',
                    marginBottom: 24,
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap',
                }}>
                    {[
                        { label: 'Jenis', value: reportType },
                        { label: 'Periode', value: periodLabel },
                        { label: 'Format', value: formatLabel },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p style={{ fontSize: 10, color: '#B7791F', fontWeight: 600, margin: 0, marginBottom: 2 }}>{label}</p>
                            <p style={{ fontSize: 12, color: '#06283A', fontWeight: 600, margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Cancel Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#fff',
                            color: '#6B7280',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Batalkan Export
                    </button>
                </div>
            </div>
        </div>
    );
};
