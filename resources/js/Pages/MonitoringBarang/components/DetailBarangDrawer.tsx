import { Package, X } from 'lucide-react';
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
                className="absolute inset-0 z-40 rounded-2xl bg-black/10 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="
                    absolute
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
                    width: 380,
                    top: 16,
                    right: 16,
                    bottom: 16,
                }}
            >
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
                        <Package size={18} color="#06283A" />

                        <div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#06283A',
                                }}
                            >
                                Detail Barang
                            </div>

                            <div
                                style={{
                                    fontSize: 12,
                                    color: '#94A3B8',
                                }}
                            >
                                {item.contractId}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 transition"
                    >
                        <X size={18} color="#64748B" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 600,
                                        color: '#0F172A',
                                    }}
                                >
                                    {item.itemName}
                                </div>

                                <div
                                    style={{
                                        fontSize: 12,
                                        color: '#94A3B8',
                                    }}
                                >
                                    ID : {item.itemCode ?? '-'}
                                </div>
                            </div>

                            <StatusBadge status={item.status} />
                        </div>

                        <div
                            className="p-3"
                            style={{
                                backgroundColor: '#F8FAFB',
                                borderRadius: 8,
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
                                LOKASI SAAT INI
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#1E293B',
                                    marginTop: 4,
                                }}
                            >
                                {item.currentLocation ?? '-'}
                            </div>
                        </div>

                        <div
                            className="p-3 grid grid-cols-2 gap-y-3"
                            style={{
                                backgroundColor: '#FFF7ED',
                                borderRadius: 8,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                    }}
                                >
                                    BERAT TOTAL
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
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
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                    }}
                                >
                                    MODEL
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.model ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                    }}
                                >
                                    PEMBUAT
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
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
                                        color: '#94A3B8',
                                        fontWeight: 600,
                                    }}
                                >
                                    TUJUAN AKHIR
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: '#1E293B',
                                    }}
                                >
                                    {item.finalDestination ?? item.destination}
                                </div>
                            </div>
                        </div>

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
                                RIWAYAT PERJALANAN
                            </div>

                            <div className="flex flex-col">
                                {item.checkpoints
                                    .slice()
                                    .reverse()
                                    .map((cp, idx, arr) => {
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

                                                <div className="pb-4">
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

                                                    {(cp.date || cp.time) && (
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: '#94A3B8',
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {cp.date}
                                                            {cp.time
                                                                ? `, ${cp.time} WIB`
                                                                : ''}
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