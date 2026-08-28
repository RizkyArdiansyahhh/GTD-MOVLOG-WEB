import React from 'react';
import type { DownloadHistoryItem, DownloadStatus, ExportFormat } from '../types/laporan';
import { MOCK_DOWNLOAD_HISTORY } from '../constants/laporan';

/* ─── Badge helpers ─────────────────────────────────────── */
const FORMAT_BADGE: Record<ExportFormat, { bg: string; text: string; label: string }> = {
    pdf: { bg: '#FEE2E2', text: '#DC2626', label: 'PDF' },
    excel: { bg: '#DCFCE7', text: '#15803D', label: 'Excel' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    ready: { bg: '#DCFCE7', text: '#15803D', label: 'Siap Unduh' },
    'Siap Unduh': { bg: '#DCFCE7', text: '#15803D', label: 'Siap Unduh' },
    expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Kedaluwarsa' },
    'Kedaluwarsa': { bg: '#F3F4F6', text: '#6B7280', label: 'Kedaluwarsa' },
    processing: { bg: '#FFF4D6', text: '#B7791F', label: 'Sedang Diproses' },
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
            <td style={{ padding: '0 12px' }}>
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
            <td style={{ padding: '0 16px', textAlign: 'right' }}>
                {item.status === 'ready' && item.downloadUrl ? (
                    <a
                        href={item.downloadUrl}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 12px',
                            borderRadius: 7,
                            border: '1px solid #E2E8F0',
                            background: hovered ? '#FFF8EC' : '#fff',
                            color: '#06283A',
                            fontSize: 12,
                            fontWeight: 500,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                        }}
                    >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                        </svg>
                        Unduh
                    </a>
                ) : (
                    <span style={{ fontSize: 12, color: '#CBD5E0' }}>—</span>
                )}
            </td>
        </tr>
    );
};

/* ─── Main Component ─────────────────────────────────────── */
export const DownloadHistoryTable: React.FC = () => {
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        Riwayat Unduhan Laporan
                    </span>
                </div>
                <button style={{
                    padding: '6px 14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    background: '#fff',
                    color: '#B7791F',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}>
                    Lihat Semua
                </button>
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
                            {['Nama Laporan', 'Format', 'Tanggal Dibuat', 'Ukuran Berkas', 'Status', 'Aksi'].map((col, i) => (
                                <th
                                    key={col}
                                    style={{
                                        padding: '0 12px',
                                        textAlign: i === 5 ? 'right' : 'left',
                                        paddingLeft: i === 0 ? 16 : 12,
                                        paddingRight: i === 5 ? 16 : 12,
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
                        {MOCK_DOWNLOAD_HISTORY.map((item) => (
                            <HistoryRow key={item.id} item={item} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
