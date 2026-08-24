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
            <Head title="Monitoring Checkpoint — Global Trans Djaya" />

            {/* Header */}
            <div className="mb-6">
                <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wider mb-1">
                    Checkpoint Network
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Sebaran Armada di Titik Checkpoint
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                    Tinjauan posisi {total_in_transit} pengiriman kargo aktif yang sedang transit di berbagai pos operasional GTD.
                </p>
            </div>

            {checkpoints.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-gray-100 text-center text-gray-400 text-sm shadow-sm">
                    <div
                        className="flex items-center justify-center rounded-full mb-3 mx-auto"
                        style={{ width: 48, height: 48, backgroundColor: '#F6C34322' }}
                    >
                        <MapPin size={22} style={{ color: '#F6C343' }} strokeWidth={1.8} />
                    </div>
                    <p className="font-semibold text-gray-700">Tidak ada armada di titik checkpoint</p>
                    <p className="text-xs text-gray-400 mt-1">Saat ini tidak ada armada aktif yang sedang berada di titik checkpoint transit.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {checkpoints.map((group) => (
                        <div
                            key={group.checkpoint_name}
                            className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                        >
                            {/* Card Header */}
                            <div className="p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-gray-900"
                                        style={{ backgroundColor: '#F6C343' }}
                                    >
                                        {group.sequence < 900 ? group.sequence : '📍'}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm">{group.checkpoint_name}</h3>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-800 text-xs font-semibold">
                                    {group.shipments.length} Armada
                                </span>
                            </div>

                            {/* Shipments at this checkpoint */}
                            <div className="p-4 flex-1 divide-y divide-gray-100 space-y-3">
                                {group.shipments.map((s, idx) => (
                                    <div key={s.id} className={idx > 0 ? 'pt-3' : ''}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs font-semibold text-yellow-600">
                                                #{s.assignment_no}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400">{s.status_label}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-gray-800 mt-1">{s.cargo_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {s.total_quantity.toLocaleString('id-ID')} {s.unit} • {s.origin} ➔ {s.destination}
                                        </p>
                                        <div className="mt-2 text-right">
                                            <Link
                                                href={`/customer/monitoring-barang/${s.id}`}
                                                className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 inline-flex items-center gap-1"
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
