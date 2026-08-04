import React from 'react';
import type { ExportResult } from '../types/laporan';

interface ExportSuccessProps {
    result: ExportResult;
    periodLabel: string;
    onReset: () => void;
}

export const ExportSuccess: React.FC<ExportSuccessProps> = ({ result, periodLabel, onReset }) => {
    const isPdf = result.fileName.toLowerCase().endsWith('.pdf');

    const FileIcon = isPdf ? (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#E53E3E" opacity={0.15} />
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#E53E3E" strokeWidth={1.5} />
            <polyline points="14 2 14 8 20 8" stroke="#E53E3E" strokeWidth={1.5} fill="none" />
            <text x="7" y="17" fontSize="5" fill="#E53E3E" fontWeight="700">PDF</text>
        </svg>
    ) : (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#38A169" opacity={0.15} />
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#38A169" strokeWidth={1.5} />
            <polyline points="14 2 14 8 20 8" stroke="#38A169" strokeWidth={1.5} fill="none" />
            <text x="6.5" y="17" fontSize="5" fill="#38A169" fontWeight="700">XLS</text>
        </svg>
    );

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
                    textAlign: 'center',
                }}
            >
                {/* Success Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 68,
                        height: 68,
                        borderRadius: '50%',
                        background: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#15803D" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#06283A',
                    margin: 0,
                    marginBottom: 8,
                }}>
                    Laporan Siap Diunduh
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginBottom: 28, lineHeight: 1.6 }}>
                    Ekspor data untuk periode {periodLabel} siap diunduh.
                </p>

                {/* File Card */}
                <div style={{
                    background: '#F8FAFB',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 28,
                }}>
                    {FileIcon}
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#06283A', margin: 0 }}>{result.fileName}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{result.fileSize}</p>
                    <a
                        href={result.downloadUrl}
                        style={{
                            marginTop: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 22px',
                            borderRadius: 8,
                            background: '#06283A',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                        </svg>
                        Unduh Sekarang
                    </a>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                    <button
                        onClick={onReset}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: '#B7791F',
                            fontWeight: 600,
                            textDecoration: 'underline',
                        }}
                    >
                        Kembali ke Dashboard
                    </button>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            color: '#B7791F',
                            fontWeight: 600,
                            textDecoration: 'underline',
                        }}
                    >
                        Lihat Riwayat Laporan
                    </button>
                </div>
            </div>
        </div>
    );
};
