import React from 'react';
import type { DownloadHistoryItem, ExportFormat } from '../types/laporan';

/* ─── Badge helpers ─────────────────────────────────────── */
const FORMAT_BADGE: Record<ExportFormat, { bg: string; text: string; label: string }> = {
    pdf: { bg: '#FEE2E2', text: '#DC2626', label: 'PDF' },
    excel: { bg: '#DCFCE7', text: '#15803D', label: 'Excel' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    ready: { bg: '#DCFCE7', text: '#15803D', label: 'Ready' },
    'Siap Unduh': { bg: '#DCFCE7', text: '#15803D', label: 'Ready' },
    expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
    'Kedaluwarsa': { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
    processing: { bg: '#FFF4D6', text: '#B7791F', label: 'Processing' },
};

interface RowProps {
    item: DownloadHistoryItem;
}

const HistoryRow: React.FC<RowProps> = ({ item }) => {
    const fmtBadge = FORMAT_BADGE[item.format];
    const stBadge = STATUS_BADGE[item.status];

    const [hovered, setHovered] = React.useState(false);

    return (
        <tr
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? '#FFF8EC' : 'transparent',
                transition: 'background 0.12s',
                height: 44,
                borderBottom: '1px solid #F3F4F6',
            }}
        >
            <td style={{ padding: '0 16px', fontSize: 13, color: '#06283A', fontWeight: 500 }}>
                {item.name}
            </td>
            <td style={{ padding: '0 12px' }}>
                <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: fmtBadge.bg,
                    color: fmtBadge.text,
                }}>
                    {fmtBadge.label}
                </span>
            </td>
            <td style={{ padding: '0 12px', fontSize: 13, color: '#6B7280' }}>{item.createdAt}</td>
            <td style={{ padding: '0 12px', fontSize: 13, color: '#6B7280' }}>{item.fileSize}</td>
            <td style={{ padding: '0 16px 0 12px' }}>
                <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: stBadge.bg,
                    color: stBadge.text,
                }}>
                    {stBadge.label}
                </span>
            </td>
        </tr>
    );
};

/* ─── Main Component ─────────────────────────────────────── */
interface Props {
    items?: DownloadHistoryItem[];
}

export const DownloadHistoryTable: React.FC<Props> = ({ items = [] }) => {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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
                        <path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A' }}>
                    Report Download History
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{
                            background: '#F8FAFB',
                            height: 40,
                            borderBottom: '1px solid #E5E7EB',
                        }}>
                            {['Report Name', 'Format', 'Created Date', 'File Size', 'Status'].map((col, i, cols) => (
                                <th
                                    key={col}
                                    style={{
                                        padding: '0 12px',
                                        textAlign: 'left',
                                        paddingLeft: i === 0 ? 16 : 12,
                                        paddingRight: i === cols.length - 1 ? 16 : 12,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#6B7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px 16px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                                    No export history yet. Every successful export will be recorded here.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <HistoryRow key={item.id} item={item} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
