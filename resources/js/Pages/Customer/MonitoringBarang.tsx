import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type { CustomerShipmentListItem, PaginatedData } from '@/types/customer';
import {
    Search,
    MapPin,
    ArrowRight,
    PackageSearch,
    RotateCcw,
    Calendar,
} from 'lucide-react';

interface MonitoringBarangProps {
    shipments: PaginatedData<CustomerShipmentListItem>;
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function MonitoringBarang({ shipments, filters }: MonitoringBarangProps) {
    useRealtimeUpdates();

    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, status);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        applyFilters(search, newStatus);
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        router.get('/customer/monitoring-barang', {}, { preserveState: true, replace: true });
    };

    const applyFilters = (searchQuery: string, statusFilter: string) => {
        router.get(
            '/customer/monitoring-barang',
            { search: searchQuery.trim(), status: statusFilter },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Format semantic status badge (Clean text style without heavy pill backgrounds)
    const renderStatusBadge = (statusCode: string) => {
        const s = (statusCode || '').toUpperCase();
        if (s === 'IN_PROGRESS' || s === 'IN_TRANSIT' || s === 'DALAM PERJALANAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>In Transit</span>
                </span>
            );
        }
        if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'TERKIRIM') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Delivered</span>
                </span>
            );
        }
        if (s === 'CANCELLED' || s === 'DIBATALKAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>Cancelled</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Loading Preparation</span>
            </span>
        );
    };

    return (
        <CustomerLayout title="Cargo Monitoring">
            <Head title="Cargo Monitoring — GTD Customer Portal" />

            <div className="space-y-6">
                {/* ── Page Header ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#06283A] tracking-tight">
                        Cargo &amp; Fleet Monitoring
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                        Monitor transit routes, tonnage, stage statuses, and estimated arrival times (ETA) for all your cargo.
                    </p>
                </div>

                {/* ── Search & Filter Controls ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search
                                size={14}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Assignment No., Cargo Name, Origin / Destination..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50/70 focus:bg-white transition-all font-medium"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50/70 focus:bg-white transition-all cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="in_progress">In Transit</option>
                            <option value="completed">Delivered</option>
                            <option value="draft">Loading Preparation</option>
                        </select>

                        {(search || status !== 'all') && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                title="Reset Filter"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        )}
                    </form>
                </div>

                {/* ── Shipments Table Card ── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Assignment No.</th>
                                    <th className="py-3.5 px-4">Cargo &amp; Items</th>
                                    <th className="py-3.5 px-4">Transit Route (Origin ➔ Destination)</th>
                                    <th className="py-3.5 px-4">Checkpoint Location</th>
                                    <th className="py-3.5 px-4">Estimated Arrival (ETA)</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-normal">
                                {shipments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center text-slate-400">
                                            <PackageSearch size={28} className="mx-auto mb-2 text-slate-300" />
                                            <p className="font-bold text-slate-700 text-xs">No cargo shipments found</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search keywords or status filter.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    shipments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Assignment No & Date */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <div className="font-semibold text-[#06283A] font-mono text-xs">
                                                    #{item.assignment_no}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                                                    {item.created_at}
                                                </div>
                                            </td>

                                            {/* Cargo & Breakdown */}
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-slate-900">{item.cargo_name}</div>
                                                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                                    {item.units && item.units.length > 0 ? (
                                                        <span>
                                                            {item.units.map((u, i) => (
                                                                <span key={i}>
                                                                    {i > 0 && <span className="mx-1 text-slate-300">&middot;</span>}
                                                                    {u.name} (x{u.qty})
                                                                </span>
                                                            ))}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {Number(item.quantity).toLocaleString('en-US')} {item.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Route */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 text-slate-800 text-xs font-medium max-w-[220px]">
                                                    <span className="font-semibold text-slate-900 truncate">{item.origin}</span>
                                                    <ArrowRight size={11} className="text-slate-400 shrink-0" />
                                                    <span className="text-slate-700 truncate">{item.destination}</span>
                                                </div>
                                            </td>

                                            {/* Checkpoint */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                                                    <MapPin size={13} className="text-[#F6C343] shrink-0" />
                                                    <span className="truncate max-w-[170px]">{item.current_checkpoint}</span>
                                                </div>
                                            </td>

                                            {/* ETA */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span>{item.eta || '-'}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {renderStatusBadge(item.status)}
                                            </td>

                                            {/* Action */}
                                            <td className="py-4 px-5 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/customer/shipment/${item.id}`}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] text-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-xs"
                                                >
                                                    <span>DETAIL</span>
                                                    <ArrowRight size={11} />
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
                        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Showing <span className="font-semibold text-slate-800">{shipments.from ?? 0}</span> -{' '}
                                <span className="font-semibold text-slate-800">{shipments.to ?? 0}</span> of{' '}
                                <span className="font-semibold text-slate-800">{shipments.total}</span> total sessions
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                                {shipments.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url ?? '#'}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'text-[#06283A] bg-[#F6C343] shadow-xs'
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
            </div>
        </CustomerLayout>
    );
}
