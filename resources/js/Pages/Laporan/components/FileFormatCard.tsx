import React from 'react';
import type { ExportFormat } from '../types/laporan';

interface FormatOption {
    key: ExportFormat;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const PDF_ICON = (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#E53E3E" opacity={0.15} />
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#E53E3E" strokeWidth={1.5} fill="none" />
        <polyline points="14 2 14 8 20 8" stroke="#E53E3E" strokeWidth={1.5} fill="none" />
        <text x="7" y="17" fontSize="6" fill="#E53E3E" fontWeight="700">PDF</text>
    </svg>
);

const EXCEL_ICON = (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#38A169" opacity={0.15} />
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#38A169" strokeWidth={1.5} fill="none" />
        <polyline points="14 2 14 8 20 8" stroke="#38A169" strokeWidth={1.5} fill="none" />
        <text x="6.5" y="17" fontSize="5" fill="#38A169" fontWeight="700">XLS</text>
    </svg>
);

const FORMAT_OPTIONS: FormatOption[] = [
    {
        key: 'pdf',
        label: 'PDF Document',
        description: 'Sesuai untuk arsip digital dan pencetakan.',
        icon: PDF_ICON,
    },
    {
        key: 'excel',
        label: 'Excel / CSV',
        description: 'Sesuai untuk pengolahan data mentah.',
        icon: EXCEL_ICON,
    },
];

interface FileFormatCardProps {
    selectedFormat: ExportFormat;
    onFormatChange: (format: ExportFormat) => void;
}

export const FileFormatCard: React.FC<FileFormatCardProps> = ({ selectedFormat, onFormatChange }) => {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                padding: 20,
            }}
        >
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: '#FFF4D6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#B7791F" strokeWidth={2}>
                        <path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline strokeLinecap="round" points="14 2 14 8 20 8" />
                    </svg>
                </span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A' }}>
                    Format Berkas
                </span>
            </div>

            {/* Format Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {FORMAT_OPTIONS.map((opt) => {
                    const isSelected = selectedFormat === opt.key;
                    return (
                        <button
                            key={opt.key}
                            onClick={() => onFormatChange(opt.key)}
                            style={{
                                height: 110,
                                borderRadius: 10,
                                border: isSelected ? '2px solid #B7791F' : '1px solid #E2E8F0',
                                background: isSelected ? '#FFF8EC' : '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                padding: '0 16px',
                                gap: 6,
                                transition: 'all 0.15s',
                                textAlign: 'left',
                            }}
                        >
                            {opt.icon}
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#06283A' }}>{opt.label}</span>
                            <span style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{opt.description}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
