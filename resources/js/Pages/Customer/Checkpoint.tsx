import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CheckpointOverviewGroup } from '@/types/customer';
import { MapPin, ArrowRight, Package } from 'lucide-react';

interface CheckpointPageProps {
    checkpoints: CheckpointOverviewGroup[];
    total_in_transit: number;
}

export default function Checkpoint({ checkpoints, total_in_transit }: CheckpointPageProps) {
    return (
        <CustomerLayout title="Monitoring Checkpoint">
            <Head title="Monitoring Checkpoint" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sebaran Armada di Titik Checkpoint
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tinjauan posisi {total_in_transit} pengiriman kargo aktif yang sedang transit di berbagai pos operasional GTD.
                </p>
            </div>

            {checkpoints.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-sm shadow-xs">
                    <MapPin size={36} className="mx-auto mb-2 opacity-30 text-amber-500" />
                    Saat ini tidak ada armada aktif yang sedang berada di titik checkpoint transit.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {checkpoints.map((group) => (
                        <div
                            key={group.checkpoint_name}
                            className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs flex flex-col"
                        >
                            {/* Card Header */}
                            <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-700 font-extrabold text-xs">
                                        {group.sequence < 900 ? group.sequence : '📍'}
                                    </div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">{group.checkpoint_name}</h3>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-extrabold border border-amber-200">
                                    {group.shipments.length} Armada
                                </span>
                            </div>

                            {/* Shipments at this checkpoint */}
                            <div className="p-4 flex-1 divide-y divide-slate-100 space-y-3">
                                {group.shipments.map((s, idx) => (
                                    <div key={s.id} className={idx > 0 ? 'pt-3' : ''}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs font-black text-amber-600">
                                                #{s.assignment_no}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{s.status_label}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 mt-1">{s.cargo_name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {s.total_quantity.toLocaleString('id-ID')} {s.unit} • {s.origin} ➔ {s.destination}
                                        </p>
                                        <div className="mt-2 text-right">
                                            <Link
                                                href={`/customer/monitoring-barang/${s.id}`}
                                                className="text-[11px] font-extrabold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 uppercase"
                                            >
                                                <span>Detail Shipment</span>
                                                <ArrowRight size={11} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CustomerLayout>
    );
}
