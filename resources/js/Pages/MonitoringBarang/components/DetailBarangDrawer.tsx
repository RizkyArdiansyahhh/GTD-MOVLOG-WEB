import { Package, X, FileText, ExternalLink } from 'lucide-react';
import type { MonitoringItem } from '../types/monitoringBarang';
import { StatusBadge } from './StatusBadge';

interface DetailBarangDrawerProps {
    item: MonitoringItem;
    onClose: () => void;
}

export function DetailBarangDrawer({ item, onClose }: DetailBarangDrawerProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="
                    fixed
                    z-50
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                    flex
                    flex-col
                    transition-all
                    duration-300
                "
                style={{
                    width: 420,
                    top: 16,
                    right: 16,
                    bottom: 16,
                }}
            >
                {/* Header */}
                <div
                    className="
                        sticky
                        top-0
                        z-10
                        flex
                        items-center
                        justify-between
                        px-5
                        py-4
                        bg-white
                    "
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                    <div className="flex items-center gap-2">
                        <Package size={20} color="#06283A" />

                        <div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#06283A',
                                }}
                            >
                                Detail Barang & Pengiriman
                            </div>

                            <div
                                style={{
                                    fontSize: 11,
                                    color: '#94A3B8',
                                }}
                            >
                                {item.contractId} &bull; {item.shippingSession}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 px-5 py-4">
                        {/* Title & Customer */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 600,
                                        color: '#0F172A',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {item.itemName}
                                </div>

                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#64748B',
                                        marginTop: 2,
                                    }}
                                >
                                    Customer: <span className="font-semibold text-slate-800">{item.customerName}</span>
                                </div>

                                <div
                                    style={{
                                        fontSize: 11,
                                        color: '#94A3B8',
                                        marginTop: 1,
                                    }}
                                >
                                    HS Code / ID: {item.itemCode ?? '-'}
                                </div>
                            </div>

                            <StatusBadge status={item.status} />
                        </div>

                        {/* Lokasi */}
                        <div
                            className="p-3"
                            style={{
                                backgroundColor: '#F8FAFB',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#94A3B8',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                RUTE PENGIRIMAN
                            </div>

                            <div className="flex items-center justify-between mt-2 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pelabuhan Muat (Asal)</span>
                                    <span className="font-semibold text-slate-800">{item.origin || '-'}</span>
                                </div>
                                <span className="text-slate-300 font-bold">&rarr;</span>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pelabuhan Bongkar (Tujuan)</span>
                                    <span className="font-semibold text-slate-800">{item.finalDestination ?? item.destination}</span>
                                </div>
                            </div>
                        </div>

                        {/* Spesifikasi Kargo */}
                        <div
                            className="p-3 grid grid-cols-2 gap-y-3"
                            style={{
                                backgroundColor: '#FFF7ED',
                                borderRadius: 8,
                                border: '1px solid #FED7AA',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#9A3412',
                                        fontWeight: 600,
                                    }}
                                >
                                    BERAT TOTAL
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.totalWeight ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#9A3412',
                                        fontWeight: 600,
                                    }}
                                >
                                    TIPE / MODEL
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.model && item.model !== '-' ? item.model : item.itemType}
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#9A3412',
                                        fontWeight: 600,
                                    }}
                                >
                                    MANUFAKTUR / BRAND
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.manufacturer ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#9A3412',
                                        fontWeight: 600,
                                    }}
                                >
                                    DIBUAT OLEH
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.createdBy ?? 'Staff'}
                                </div>
                            </div>
                        </div>

                        {/* Dokumen Terlampir (Dari SubmitBerkas) */}
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#94A3B8',
                                    letterSpacing: '0.05em',
                                    marginBottom: 8,
                                }}
                            >
                                BERKAS DOKUMEN DISERAHKAN ({item.documents.length})
                            </div>

                            {item.documents.length === 0 ? (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-400">
                                    Belum ada berkas PDF yang terunggah.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {item.documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText size={16} className="text-blue-600 shrink-0" />
                                                <div className="truncate">
                                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                                        {doc.type}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate">
                                                        {doc.name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <span
                                                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                                                    style={{
                                                        backgroundColor:
                                                            doc.status === 'Disetujui'
                                                                ? '#DCFCE7'
                                                                : doc.status === 'Ditolak'
                                                                    ? '#FEE2E2'
                                                                    : '#FEF3C7',
                                                        color:
                                                            doc.status === 'Disetujui'
                                                                ? '#166534'
                                                                : doc.status === 'Ditolak'
                                                                    ? '#991B1B'
                                                                    : '#92400E',
                                                    }}
                                                >
                                                    {doc.status}
                                                </span>

                                                {doc.fileUrl && (
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Buka Dokumen PDF"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Riwayat Status */}
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#94A3B8',
                                    letterSpacing: '0.05em',
                                    marginBottom: 10,
                                }}
                            >
                                RIWAYAT STATUS PENGIRIMAN
                            </div>

                            <div className="flex flex-col">
                                {item.checkpoints.map((cp, idx, arr) => {
                                    const isActive =
                                        cp.status === 'current' ||
                                        cp.status === 'completed';

                                    return (
                                        <div
                                            key={cp.id}
                                            className="flex gap-3 relative"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span
                                                    className="rounded-full shrink-0"
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        marginTop: 4,
                                                        backgroundColor: isActive
                                                            ? '#2563EB'
                                                            : '#CBD5E1',
                                                    }}
                                                />

                                                {idx < arr.length - 1 && (
                                                    <span
                                                        style={{
                                                            width: 1,
                                                            flex: 1,
                                                            backgroundColor:
                                                                '#CBD5E1',
                                                            minHeight: 24,
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div className="pb-3">
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: '#1E293B',
                                                    }}
                                                >
                                                    {cp.name}
                                                </div>

                                                {cp.notes && (
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#64748B',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {cp.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
