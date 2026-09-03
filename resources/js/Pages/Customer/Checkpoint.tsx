import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type { CheckpointOverviewGroup } from '@/types/customer';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

interface CheckpointPageProps {
    checkpoints: CheckpointOverviewGroup[];
    total_in_transit: number;
}

export default function Checkpoint({ checkpoints = [], total_in_transit = 0 }: CheckpointPageProps) {
    useRealtimeUpdates();

    const activeCheckpoints = checkpoints.filter((cp) => cp.active_fleets > 0);
    const displayedCheckpoints = activeCheckpoints.length > 0 ? activeCheckpoints : checkpoints;

    return (
        <CustomerLayout title="Checkpoint Monitoring">
            <Head title="Checkpoints — GTD Customer Portal" />

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <Link
                        href="/customer/monitoring-barang"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-2"
                    >
                        <ArrowLeft size={13} />
                        <span>Buka Monitoring Kargo Lengkap</span>
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#06283A] tracking-tight">
                        Transit Checkpoints
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                        Distribusi {total_in_transit} pengiriman kargo aktif yang sedang melintasi pos operasional GTD.
                    </p>
                </div>

                {displayedCheckpoints.length === 0 ? (
                    <div className="p-12 rounded-xl bg-white border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
                        <MapPin size={26} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">No fleets at checkpoint locations</p>
                        <p className="text-xs text-slate-400 mt-1">Saat ini tidak ada armada aktif yang sedang berada di titik checkpoint transit.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedCheckpoints.map((group) => (
                            <div
                                key={group.id || group.name}
                                className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                            >
                                {/* Card Header */}
                                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-md bg-[#0F172A] text-[#F6C343] font-bold text-xs flex items-center justify-center">
                                            {group.sequence < 900 ? group.sequence : '•'}
                                        </span>
                                        <h3 className="font-bold text-[#06283A] text-xs sm:text-sm">{group.name}</h3>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                                        {group.active_fleets} Sessions
                                    </span>
                                </div>

                                {/* Shipments at this checkpoint */}
                                <div className="p-4 flex-1 divide-y divide-slate-100 space-y-3">
                                    {group.shipments.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-2 font-normal">Tidak ada armada di pos ini.</p>
                                    ) : (
                                        group.shipments.map((s, idx) => (
                                            <div key={s.id} className={idx > 0 ? 'pt-3' : ''}>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-semibold text-[#06283A]">
                                                        #{s.assignment_no}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                        <span>In Transit</span>
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-800 mt-1">{s.cargo_name}</p>
                                                {s.total_quantity && (
                                                    <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                                                        {Number(s.total_quantity).toLocaleString('id-ID')} {s.unit}
                                                    </p>
                                                )}
                                                <div className="mt-2.5 text-right">
                                                    <Link
                                                        href={`/customer/shipment/${s.id}`}
                                                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                                                    >
                                                        <span>Shipment Details</span>
                                                        <ArrowRight size={11} />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
