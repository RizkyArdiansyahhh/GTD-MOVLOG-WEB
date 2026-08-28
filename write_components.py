PAGES = '/home/ieull/projects/GTD-MOVLOG-WEB/resources/js/Pages/MonitoringBarang'

index_code = """import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { MonitoringItem, ShippingStatus } from './types/monitoringBarang';
import { StatusBadge } from './components/StatusBadge';
import { ProgressTimeline } from './components/ProgressTimeline';
import { DocumentTable } from './components/DocumentTable';
import { ReportTable } from './components/ReportTable';
import { PhotoGallery } from './components/PhotoGallery';
import { ActivityFeed } from './components/ActivityFeed';
import { useMonitoringBarang } from './hooks/useMonitoringBarang';
import { SHIPPING_STATUS_CONFIG } from './constants/status';

interface Props {
    items: MonitoringItem[];
}

const ALL_STATUSES = Object.keys(SHIPPING_STATUS_CONFIG) as ShippingStatus[];

const TABS = [
    { key: 'checkpoint', label: 'Checkpoint' },
    { key: 'dokumen', label: 'Dokumen' },
    { key: 'report', label: 'Laporan' },
    { key: 'foto', label: 'Foto' },
    { key: 'aktivitas', label: 'Aktivitas' },
] as const;

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
    return (
        <svg
            className={'w-3.5 h-3.5 ml-1 inline-block transition-transform ' + (active ? 'text-indigo-500' : 'text-slate-300')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
        >
            {dir === 'asc' || !active ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 15l4 4 4-4M8 9l4-4 4 4" />
            )}
        </svg>
    );
}

export default function MonitoringBarangIndex({ items = [] }: Props) {
    const {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        sortField,
        sortDir,
        handleSort,
        filtered,
        selectedItem,
        setSelectedItem,
        activeTab,
        setActiveTab,
    } = useMonitoringBarang(items);

    return (
        <AppLayout title="Monitor Barang">
            <Head title="Monitor Barang" />

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Monitor Barang
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Pantau seluruh perjalanan barang secara real-time.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {ALL_STATUSES.map((status) => {
                    const count = items.filter((i) => i.status === status).length;
                    const cfg = SHIPPING_STATUS_CONFIG[status];
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                            className="flex flex-col items-start p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-150 text-left cursor-pointer"
                            style={{
                                borderColor: statusFilter === status ? cfg.text : '#E2E8F0',
                                outline: statusFilter === status ? `2px solid ${cfg.text}` : 'none',
                            }}
                        >
                            <span
                                className="text-2xl font-bold"
                                style={{ color: cfg.text }}
                            >
                                {count}
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5 leading-tight">{status}</span>
                        </button>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="search-monitoring"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari sesi, pelanggan, barang..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow"
                    />
                </div>

                {/* Status Filter */}
                <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow cursor-pointer"
                >
                    <option value="">Semua Status</option>
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <div className="ml-auto text-xs text-slate-400 self-center">
                    {filtered.length} dari {items.length} data
                </div>
            </div>

            {/* Main Layout: Table + Detail Panel */}
            <div className="flex gap-6">
                {/* Table */}
                <div className={selectedItem ? 'w-2/5 flex-shrink-0' : 'flex-1'}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th
                                            className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none"
                                            onClick={() => handleSort('shippingSession')}
                                        >
                                            Sesi Pengiriman
                                            <SortIcon active={sortField === 'shippingSession'} dir={sortDir} />
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none"
                                            onClick={() => handleSort('customerName')}
                                        >
                                            Pelanggan
                                            <SortIcon active={sortField === 'customerName'} dir={sortDir} />
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rute</th>
                                        <th
                                            className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none"
                                            onClick={() => handleSort('status')}
                                        >
                                            Status
                                            <SortIcon active={sortField === 'status'} dir={sortDir} />
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Checkpoint</th>
                                        <th
                                            className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none"
                                            onClick={() => handleSort('estimatedArrival')}
                                        >
                                            Est. Tiba
                                            <SortIcon active={sortField === 'estimatedArrival'} dir={sortDir} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                                                Tidak ada data yang cocok.
                                            </td>
                                        </tr>
                                    )}
                                    {filtered.map((item) => {
                                        const isSelected = selectedItem?.id === item.id;
                                        const progress = item.totalCheckpoints > 0
                                            ? Math.round((item.completedCheckpoints / item.totalCheckpoints) * 100)
                                            : 0;
                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => setSelectedItem(isSelected ? null : item)}
                                                className={'cursor-pointer transition-colors ' + (isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50')}
                                            >
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-slate-900">{item.shippingSession}</p>
                                                    <p className="text-[11px] text-slate-400">{item.itemName}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-slate-700">{item.customerName}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <span className="font-medium text-slate-700">{item.origin}</span>
                                                        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <span className="font-medium text-slate-700">{item.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[48px]">
                                                            <div
                                                                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            {item.completedCheckpoints}/{item.totalCheckpoints}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                                                    {item.estimatedArrival}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedItem && (
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
                            {/* Detail Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50 to-slate-50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-base font-bold text-slate-900">{selectedItem.shippingSession}</h2>
                                        <StatusBadge status={selectedItem.status} />
                                    </div>
                                    <p className="text-sm text-slate-600">{selectedItem.customerName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {selectedItem.origin} → {selectedItem.destination}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                                    aria-label="Tutup detail"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-slate-100 text-xs">
                                {[
                                    { label: 'No. Kontrak', value: selectedItem.contractId },
                                    { label: 'Jenis Barang', value: selectedItem.itemType },
                                    { label: 'Nama Barang', value: selectedItem.itemName },
                                    { label: 'Dibuat Oleh', value: selectedItem.createdBy },
                                    { label: 'Update Terakhir', value: selectedItem.lastUpdate },
                                    { label: 'Estimasi Tiba', value: selectedItem.estimatedArrival },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-slate-400">{label}</p>
                                        <p className="font-medium text-slate-800 mt-0.5">{value || '-'}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-100 px-5 overflow-x-auto">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={
                                            'py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ' +
                                            (activeTab === tab.key
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-slate-400 hover:text-slate-700')
                                        }
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="px-5 py-4 max-h-[460px] overflow-y-auto">
                                {activeTab === 'checkpoint' && (
                                    <ProgressTimeline checkpoints={selectedItem.checkpoints} />
                                )}
                                {activeTab === 'dokumen' && (
                                    <DocumentTable documents={selectedItem.documents} />
                                )}
                                {activeTab === 'report' && (
                                    <ReportTable reports={selectedItem.reports} />
                                )}
                                {activeTab === 'foto' && (
                                    <PhotoGallery photos={selectedItem.photos} />
                                )}
                                {activeTab === 'aktivitas' && (
                                    <ActivityFeed activities={selectedItem.activities} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
"""

with open(PAGES + '/Index.tsx', 'w') as f:
    f.write(index_code)
print('OK: Index.tsx restored')
