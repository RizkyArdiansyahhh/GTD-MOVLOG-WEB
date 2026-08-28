import { Package, X, FileText, ExternalLink, Boxes } from 'lucide-react';
import type { MonitoringItem, CiCargoDetail } from '../types/monitoringBarang';
import { StatusBadge } from './StatusBadge';

interface DetailBarangDrawerProps {
    item: MonitoringItem;
    onClose: () => void;
}

export function DetailBarangDrawer({ item, onClose }: DetailBarangDrawerProps) {
    const cargoList: CiCargoDetail[] = item.cargos && item.cargos.length > 0 ? item.cargos : [];

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
                    width: 480,
                    top: 16,
                    right: 16,
                    bottom: 16,
                }}
            >
                {/* Header - Hanya Menampilkan Nomor Assignment */}
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
                    <div className="flex items-center gap-2.5">
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
                                    color: '#64748B',
                                    fontWeight: 500,
                                }}
                            >
                                No. Assignment: <span className="font-semibold text-slate-800">{item.shippingSession || item.id}</span>
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
                        {/* Title (Nama Barang Lengkap) & Customer */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
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

                                {item.itemCode && item.itemCode !== '-' && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#94A3B8',
                                            marginTop: 1,
                                        }}
                                    >
                                        HS Code: {item.itemCode}
                                    </div>
                                )}
                            </div>

                            <StatusBadge status={item.status} />
                        </div>

                        {/* Rute Pengiriman */}
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

                        {/* Spesifikasi Ringkasan Kargo */}
                        <div
                            className="p-3 grid grid-cols-3 gap-y-3 gap-x-2"
                            style={{
                                backgroundColor: '#FFF7ED',
                                borderRadius: 8,
                                border: '1px solid #FED7AA',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 10, color: '#9A3412', fontWeight: 600 }}>
                                    BERAT KESELURUHAN
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginTop: 1 }}>
                                    {item.totalWeight ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 10, color: '#9A3412', fontWeight: 600 }}>
                                    TOTAL ITEM KARGO
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginTop: 1 }}>
                                    {cargoList.length > 0 ? `${cargoList.length} Barang` : (item.itemCount ? `${item.itemCount} Barang` : '1 Barang')}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 10, color: '#9A3412', fontWeight: 600 }}>
                                    BRAND
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginTop: 1 }}>
                                    {item.manufacturer && item.manufacturer !== '-' ? item.manufacturer : '-'}
                                </div>
                            </div>
                        </div>

                        {/* Rincian Seluruh Barang dari Konsolidasi Dokumen (Merged Cargo) */}
                        <div>
                            <div
                                className="flex items-center justify-between"
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#94A3B8',
                                    letterSpacing: '0.05em',
                                    marginBottom: 8,
                                }}
                            >
                                <span>RINCIAN SEMUA BARANG ({cargoList.length})</span>
                                <span className="flex items-center gap-1 text-slate-500 font-normal text-[10px]">
                                    <Boxes size={12} /> {cargoList.length} Item terdaftar
                                </span>
                            </div>

                            {cargoList.length === 0 ? (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-400">
                                    Belum ada data barang spesifik.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {cargoList.map((cargo, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        Item #{idx + 1}
                                                    </div>
                                                    <div className="font-semibold text-xs text-slate-800">
                                                        {cargo.descriptionOfGoods || `Barang #${idx + 1}`}
                                                    </div>
                                                </div>
                                                {cargo.type && cargo.type !== '-' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold shrink-0 border border-blue-100">
                                                        {cargo.type}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2.5 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                                                <div>
                                                    <span className="text-slate-400 block text-[10px]">Brand</span>
                                                    <span className="text-slate-700 font-medium">{cargo.brand || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-[10px]">Jumlah</span>
                                                    <span className="text-slate-700 font-medium">
                                                        {cargo.quantity || '-'} {cargo.unit || ''}
                                                    </span>
                                                </div>
                                                {cargo.netWeight && (
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px]">Net Weight</span>
                                                        <span className="text-slate-700 font-medium">{cargo.netWeight} kg</span>
                                                    </div>
                                                )}
                                                {cargo.grossWeight && (
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px]">Gross Weight</span>
                                                        <span className="text-slate-700 font-medium">{cargo.grossWeight} kg</span>
                                                    </div>
                                                )}
                                                {cargo.price && (
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px]">Harga</span>
                                                        <span className="text-slate-700 font-medium">{cargo.price}</span>
                                                    </div>
                                                )}
                                                {cargo.hsCode && cargo.hsCode !== '-' && (
                                                    <div className="col-span-2">
                                                        <span className="text-slate-400 block text-[10px]">HS Code</span>
                                                        <span className="text-slate-700 font-medium">{cargo.hsCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dokumen Terlampir */}
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

                        {/* Riwayat Status Pengiriman */}
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
