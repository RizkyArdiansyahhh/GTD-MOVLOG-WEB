import React from 'react';

interface ExportSummaryProps {
    reportType: string;
    periodLabel: string;
    formatLabel: string;
    onExport: () => void;
}

export const ExportSummary: React.FC<ExportSummaryProps> = ({
    reportType,
    periodLabel,
    formatLabel,
    onExport,
}) => {
    const fields = [
        { label: 'Laporan', value: reportType },
        { label: 'Periode', value: periodLabel },
        { label: 'Format', value: formatLabel },
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
                    Ringkasan Export
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

            {/* Export Button */}
            <button
                onClick={onExport}
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
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                    transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
                EKSPOR LAPORAN SEKARANG
            </button>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 12, marginBottom: 0 }}>
                Waktu proses rata-rata ± 12 detik
            </p>
        </div>
    );
};
