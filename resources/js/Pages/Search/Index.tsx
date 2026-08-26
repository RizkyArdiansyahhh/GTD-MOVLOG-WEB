import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Search,
    Package,
    ClipboardList,
    FileText,
    MapPin,
    Users,
    ArrowRight,
    ArrowLeft,
    Layers,
    Filter,
    X,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { FullSearchData, SearchResultItem, SearchCategoryType } from '@/Components/GlobalSearch/types';
import type { PageProps } from '@/types';

interface SearchPageProps extends PageProps {
    searchData: FullSearchData;
    filters: {
        q: string;
        category?: string;
    };
}

export default function SearchIndex({ searchData, filters }: SearchPageProps) {
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const activeCategory = filters.category || 'all';

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/search',
            {
                q: searchQuery,
                category: activeCategory !== 'all' ? activeCategory : undefined,
            },
            { preserveState: true }
        );
    };

    const handleCategoryChange = (categoryKey: string) => {
        router.get(
            '/search',
            {
                q: searchQuery,
                category: categoryKey !== 'all' ? categoryKey : undefined,
            },
            { preserveState: true }
        );
    };

    const getCategoryIcon = (category: SearchCategoryType) => {
        switch (category) {
            case 'barang':
                return <Package size={16} className="text-amber-600" />;
            case 'sesi':
                return <ClipboardList size={16} className="text-blue-600" />;
            case 'dokumen':
                return <FileText size={16} className="text-emerald-600" />;
            case 'checkpoint':
                return <MapPin size={16} className="text-purple-600" />;
            case 'users':
                return <Users size={16} className="text-orange-600" />;
            default:
                return <Search size={16} className="text-gray-500" />;
        }
    };

    const getCategoryBadgeClass = (category: SearchCategoryType) => {
        switch (category) {
            case 'barang':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'sesi':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'dokumen':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'checkpoint':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'users':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusBadge = (status: string, statusType: string) => {
        const type = statusType?.toLowerCase() || '';
        let bgClass = 'bg-gray-100 text-gray-700';

        if (type.includes('transit') || type.includes('progress') || type.includes('aktif') || type === 'active') {
            bgClass = 'bg-blue-50 text-blue-700 border border-blue-200';
        } else if (type.includes('approved') || type.includes('selesai') || type.includes('delivered') || type.includes('completed')) {
            bgClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        } else if (type.includes('pending') || type.includes('menunggu')) {
            bgClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        } else if (type.includes('reject') || type.includes('inactive') || type.includes('batal')) {
            bgClass = 'bg-red-50 text-red-700 border border-red-200';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${bgClass}`}>
                {status}
            </span>
        );
    };

    const categoriesList = [
        { key: 'all', label: 'Semua Kategori', count: searchData.total_count, icon: Layers },
        ...Object.entries(searchData.category_counts || {}).map(([k, v]) => ({
            key: k,
            label: v.label,
            count: v.count,
            icon: getCategoryIcon(k as SearchCategoryType).type as React.ElementType,
        })),
    ];

    return (
        <DashboardLayout>
            <Head title={searchData.query ? `Hasil Pencarian "${searchData.query}"` : 'Pencarian Global — GTD MoveLog'} />

            {/* ── Top Header ── */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Kembali</span>
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-xs text-gray-400">Pencarian Global</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">
                    {searchData.query ? (
                        <span>
                            Hasil Pencarian untuk <span className="text-yellow-600 font-extrabold">&ldquo;{searchData.query}&rdquo;</span>
                        </span>
                    ) : (
                        <span>Pusat Pencarian Global</span>
                    )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {searchData.query
                        ? `Ditemukan ${searchData.total_count} hasil di seluruh modul sistem yang dapat Anda akses.`
                        : 'Ketik kata kunci untuk mencari barang, tracking, sesi kerja, dokumen, atau akun.'}
                </p>
            </div>

            {/* ── Search Input Box ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="flex-1 relative flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-transparent transition-all">
                        <Search size={18} className="text-gray-400 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari tracking ID, nama unit, ID sesi, nomor dokumen, nama pihak, checkpoint..."
                            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 font-bold text-gray-900 text-sm transition-colors shrink-0 shadow-sm"
                    >
                        Cari
                    </button>
                </form>

                {/* ── Category Filters Pills ── */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 overflow-x-auto pb-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 shrink-0">
                        <Filter size={13} />
                        <span>Kategori:</span>
                    </div>

                    {categoriesList.map((cat) => {
                        const isActive = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => handleCategoryChange(cat.key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-yellow-400 text-gray-900 font-bold shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                            >
                                <span>{cat.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        isActive ? 'bg-yellow-500/80 text-gray-900' : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {cat.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Search Results List ── */}
            {searchData.results && searchData.results.length > 0 ? (
                <div className="space-y-3">
                    {searchData.results.map((item: SearchResultItem) => (
                        <div
                            key={item.id}
                            onClick={() => router.visit(item.url)}
                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 shrink-0 group-hover:bg-yellow-50 transition-colors">
                                    {getCategoryIcon(item.category)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(
                                                item.category
                                            )}`}
                                        >
                                            {item.category_label}
                                        </span>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-yellow-700 transition-colors truncate">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {item.subtitle}
                                    </p>

                                    {/* Metadata tags */}
                                    {item.metadata && (
                                        <div className="flex flex-wrap gap-2 mt-2.5">
                                            {Object.entries(item.metadata).map(([k, v]) => {
                                                if (!v) return null;
                                                return (
                                                    <span
                                                        key={k}
                                                        className="inline-flex items-center text-[11px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100"
                                                    >
                                                        <span className="text-gray-400 capitalize mr-1">{k.replace('_', ' ')}:</span>
                                                        <span className="font-semibold text-gray-700">{String(v)}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                                {getStatusBadge(item.status, item.status_type)}
                                <div className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 group-hover:text-yellow-700 group-hover:translate-x-1 transition-all">
                                    <span>Buka</span>
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── Empty State ── */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-600 mb-4">
                        <Search size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {searchData.query ? 'Tidak Ada Data Ditemukan' : 'Mulai Pencarian Global'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        {searchData.query
                            ? `Kami tidak menemukan data apa pun untuk "${searchData.query}". Pastikan kata kunci benar atau coba gunakan nomor tracking/sesi lain.`
                            : 'Gunakan kotak pencarian di atas untuk menemukan data tracking barang, dokumen, sesi pekerja, checkpoint, dan akun.'}
                    </p>

                    <div className="inline-flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Contoh pencarian:</span>
                        {['Excavator CAT 320', 'TRK-2024-001', 'SES-2048', 'INV-2026-014', 'Pelabuhan'].map((term) => (
                            <button
                                key={term}
                                type="button"
                                onClick={() => {
                                    setSearchQuery(term);
                                    router.get('/search', { q: term });
                                }}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-yellow-100 hover:text-yellow-900 rounded-lg transition-colors font-medium"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}