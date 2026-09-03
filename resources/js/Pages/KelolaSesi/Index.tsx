import { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { mockWorkSessions } from './mockData';
import type { WorkSession, FieldWorker } from './types';
import SesiTable from './components/SesiTable';
import SesiPagination from './components/SesiPagination';

const ITEMS_PER_PAGE = 6;

interface KelolaSesiIndexProps {
    fieldWorkers?: FieldWorker[];
    sessions?: WorkSession[];
}

export default function KelolaSesiIndex({ sessions, fieldWorkers }: KelolaSesiIndexProps) {
    const pageProps = usePage<{ flash?: { success?: string } }>().props;
    const flash = pageProps.flash;
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const activeSessions = sessions && sessions.length > 0 ? sessions : mockWorkSessions;

    // Filter sessions based on search query (ID Sesi or Nama Unit or Petugas)
    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return activeSessions;
        const q = searchQuery.toLowerCase().trim();
        return activeSessions.filter(
            (s) =>
                (s.sessionId || s.id).toLowerCase().includes(q) ||
                (s.unitName || '').toLowerCase().includes(q) ||
                (s.petugas || '').toLowerCase().includes(q)
        );
    }, [searchQuery, activeSessions]);

    // Paginate sessions
    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
    const paginatedSessions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredSessions, currentPage]);

    // Handle search input change (reset to page 1)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <DashboardLayout>
            <Head title="Worker Sessions - GTD Logistics" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* ── Outer Page Title ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#06283A]">
                            Worker Sessions
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Pusat monitoring progress pekerjaan logistik yang dibuat otomatis setelah verifikasi berkas lengkap.
                        </p>
                    </div>

                    {/* Primary Action Button */}
                    <Link
                        href="/sesi-pekerja/tambah"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        style={{
                            backgroundColor: '#F5B800',
                            color: '#06283A',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E0A800')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5B800')}
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Buat Sesi Baru</span>
                    </Link>
                </div>

                {/* ── Flash Message ── */}
                {flash?.success && (
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {/* ── Single Large Card Container ── */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-5">
                    {/* ── Search Box ── */}
                    <div className="relative w-full sm:w-[320px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search Session ID or Unit Name..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E2E8F0] rounded-xl text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent transition-all"
                        />
                    </div>

                    {/* ── Enterprise Table ── */}
                    <SesiTable sessions={paginatedSessions} />

                    {/* ── Pagination Footer ── */}
                    <SesiPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredSessions.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
