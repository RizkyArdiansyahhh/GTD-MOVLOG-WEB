import { Head, Link, router } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { PaginatedResponse } from '@/types';
import type { ShipmentSummary } from '@/types/customer';
import { useState } from 'react';
import {
    Search,
    MapPin,
    Filter,
    ArrowRight,
    PackageSearch,
    ChevronLeft,
    ChevronRight,
    Send,
} from 'lucide-react';

interface MonitoringProps {
    shipments: PaginatedResponse<ShipmentSummary>;
    filters: {
        search?: string;
        status?: string;
        per_page?: number;
    };
}

export default function MonitoringBarang({ shipments, filters }: MonitoringProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/customer/monitoring-barang',
            { search: search || undefined, status: status || undefined },
            { preserveState: true }
        );
    };

    const formatStatusBadge = (shipmentStatus: string, label: string) => {
        switch (shipmentStatus.toLowerCase()) {
            case 'in_progress':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                        DALAM PERJALANAN
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                        TERKIRIM
                    </span>
                );
            case 'draft':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        LOADING
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {label}
                    </span>
                );
        }
    };

    return (
        <CustomerLayout title="Monitoring Barang">
            <Head title="Monitoring Barang" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Monitoring Pengiriman Kargo
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Daftar lengkap sesi pengiriman kargo batubara dan mineral milik perusahaan Anda.
                    </p>
                </div>

                {/* Filter & Search Bar */}
                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari Assignment / Kargo..."
                            className="pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 w-52 sm:w-60 shadow-xs"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get(
                                '/customer/monitoring-barang',
                                { search: search || undefined, status: e.target.value || undefined },
                                { preserveState: true }
                            );
                        }}
                        className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
                    >
                        <option value="">Semua Status</option>
                        <option value="in_progress">Dalam Perjalanan</option>
                        <option value="completed">Terkirim / Selesai</option>
                        <option value="draft">Draft / Loading</option>
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Table Container */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">ID PENGIRIMAN</th>
                                <th className="py-3.5 px-4">KARGO & KUANTITAS</th>
                                <th className="py-3.5 px-4">RUTE (ASAL ➔ TUJUAN)</th>
                                <th className="py-3.5 px-4">POSISI CHECKPOINT</th>
                                <th className="py-3.5 px-4">STATUS</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                            {shipments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <PackageSearch size={36} className="mx-auto mb-2 opacity-30 text-amber-500" />
                                        <p className="font-bold text-slate-700">Tidak ada pengiriman kargo ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="font-extrabold text-slate-900 font-mono">
                                                #{item.assignment_no}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                                                {item.updated_at}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900">{item.cargo_name}</div>
                                            <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                                                {item.total_quantity.toLocaleString('id-ID')} {item.unit}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                <span className="font-semibold text-slate-900">{item.origin}</span>
                                                <ArrowRight size={12} className="text-slate-400 shrink-0" />
                                                <span className="text-slate-600">{item.destination}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                                                <MapPin size={13} className="text-amber-500 shrink-0" />
                                                <span className="truncate max-w-[160px]">{item.current_checkpoint}</span>
                                            </div>
                                            {/* Progress mini bar */}
                                            <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden border border-slate-200/60">
                                                <div
                                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${item.progress_percentage}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {formatStatusBadge(item.status, item.status_label)}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                                            <Link
                                                href={`/customer/monitoring-barang/${item.id}`}
                                                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-amber-500 hover:bg-amber-50 text-slate-900 text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                                            >
                                                <span>DETAIL</span>
                                                <ArrowRight size={12} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {shipments.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
                        <div>
                            Menampilkan <span className="font-bold text-slate-800">{shipments.from}</span> - <span className="font-bold text-slate-800">{shipments.to}</span> dari <span className="font-bold text-slate-800">{shipments.total}</span> total
                        </div>
                        <div className="flex items-center gap-1">
                            {shipments.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        link.active
                                            ? 'bg-amber-400 text-slate-950'
                                            : link.url
                                            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                            : 'text-slate-300 pointer-events-none'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
