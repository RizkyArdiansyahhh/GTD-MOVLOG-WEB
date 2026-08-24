import { Head, Link, router } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CustomerShipmentListItem, PaginatedData } from '@/types/customer';
import { Search, MapPin, ArrowRight, PackageSearch, Filter } from 'lucide-react';
import { useState } from 'react';

interface MonitoringBarangProps {
    shipments: PaginatedData<CustomerShipmentListItem>;
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function MonitoringBarang({ shipments, filters }: MonitoringBarangProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/customer/monitoring-barang',
            { search, status },
            { preserveState: true, replace: true }
        );
    };

    const formatStatusBadge = (statusCode: string, label?: string) => {
        const text = (label || statusCode || '').toUpperCase();
        if (text.includes('PERJALANAN') || text.includes('IN_PROGRESS')) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                    Dalam Perjalanan
                </span>
            );
        }
        if (text.includes('SELESAI') || text.includes('TERKIRIM') || text.includes('COMPLETED')) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Terkirim
                </span>
            );
        }
        if (text.includes('LOADING') || text.includes('DRAFT')) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    Loading
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                {label || statusCode}
            </span>
        );
    };

    return (
        <CustomerLayout title="Monitoring Barang">
            <Head title="Monitoring Barang — Global Trans Djaya" />

            {/* Page Header */}
            <div className="mb-6">
                <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wider mb-1">
                    Tracking Center
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Monitoring Barang &amp; Armada
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                    Pantau rute dan progres pengiriman barang kargo Anda secara detail dan real-time.
                </p>
            </div>

            {/* Filter and Search Bar Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6">
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari ID pengiriman, nama kargo, atau kota tujuan..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F5F5] border border-gray-200/80 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:bg-white transition-all"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-[#F5F5F5] border border-gray-200/80 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:bg-white transition-all"
                    >
                        <option value="all">Semua Status</option>
                        <option value="in_progress">Dalam Perjalanan</option>
                        <option value="completed">Terkirim / Selesai</option>
                        <option value="draft">Draft / Loading</option>
                    </select>

                    <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-gray-900 text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-95"
                        style={{ backgroundColor: '#F6C343' }}
                    >
                        <Filter size={14} />
                        <span>Filter</span>
                    </button>
                </form>
            </div>

            {/* Table Container Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">ID Pengiriman</th>
                                <th className="py-3.5 px-4">Kargo &amp; Kuantitas</th>
                                <th className="py-3.5 px-4">Rute (Asal ➔ Tujuan)</th>
                                <th className="py-3.5 px-4">Posisi Checkpoint</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium">
                            {shipments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <div
                                            className="flex items-center justify-center rounded-full mb-3 mx-auto"
                                            style={{ width: 48, height: 48, backgroundColor: '#F6C34322' }}
                                        >
                                            <PackageSearch size={22} style={{ color: '#F6C343' }} strokeWidth={1.8} />
                                        </div>
                                        <p className="font-semibold text-gray-700 text-sm">Tidak ada pengiriman kargo ditemukan</p>
                                        <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="font-semibold text-gray-900 font-mono">
                                                #{item.assignment_no}
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5 font-sans">
                                                {item.updated_at}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-semibold text-gray-900">{item.cargo_name}</div>
                                            <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                {item.total_quantity.toLocaleString('id-ID')} {item.unit}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                <span className="font-semibold text-gray-900">{item.origin}</span>
                                                <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                                <span className="text-gray-600">{item.destination}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-xs">
                                                <MapPin size={13} style={{ color: '#F6C343' }} className="shrink-0" />
                                                <span className="truncate max-w-[160px]">{item.current_checkpoint}</span>
                                            </div>
                                            {/* Progress mini bar */}
                                            <div className="w-28 bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${item.progress_percentage}%`, backgroundColor: '#F6C343' }}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {formatStatusBadge(item.status, item.status_label)}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                                            <Link
                                                href={`/customer/monitoring-barang/${item.id}`}
                                                className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-all inline-flex items-center gap-1"
                                            >
                                                <span>Detail</span>
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
                    <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
                        <div>
                            Menampilkan <span className="font-semibold text-gray-800">{shipments.from}</span> - <span className="font-semibold text-gray-800">{shipments.to}</span> dari <span className="font-semibold text-gray-800">{shipments.total}</span> total
                        </div>
                        <div className="flex items-center gap-1">
                            {shipments.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        link.active
                                            ? 'text-gray-900 font-semibold'
                                            : link.url
                                            ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            : 'text-gray-300 pointer-events-none'
                                    }`}
                                    style={{
                                        backgroundColor: link.active ? '#F6C343' : undefined,
                                    }}
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
