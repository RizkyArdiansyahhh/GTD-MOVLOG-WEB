import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    Users,
    Package,
    Truck,
    Clock,
    TrendingUp,
    ArrowUpRight,
} from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DashboardStats {
    total_users: number;
    total_shipments: number;
    active_drivers: number;
    pending_deliveries: number;
}

interface DashboardProps extends PageProps {
    stats: DashboardStats;
}

// ─────────────────────────────────────────────
// StatCard Component
// ─────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ElementType;
    accent?: string;   // bg color of icon box
    trend?: string;    // e.g. "+12%"
}

function StatCard({ label, value, icon: Icon, accent = '#F6C343', trend }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 44, height: 44, backgroundColor: `${accent}22` }}
                >
                    <Icon size={20} style={{ color: accent }} strokeWidth={2} />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <ArrowUpRight size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────
export default function Index({ stats }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <DashboardLayout>
            <Head title="Dashboard — Global Trans Djaya" />

            {/* ── Welcome Banner ── */}
            <div
                className="rounded-2xl p-6 mb-6 flex items-center justify-between overflow-hidden relative"
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                }}
            >
                {/* Decorative circle */}
                <div
                    className="absolute right-0 top-0 rounded-full opacity-10"
                    style={{
                        width: 240,
                        height: 240,
                        background: '#F6C343',
                        transform: 'translate(40%, -40%)',
                    }}
                />
                <div className="relative z-10">
                    <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-1">
                        Selamat Datang
                    </p>
                    <h1 className="text-2xl font-bold text-white">
                        {auth.user.name} 👋
                    </h1>
                    <p className="text-blue-200 text-sm mt-1">
                        Pantau operasional logistik Anda hari ini.
                    </p>
                </div>
                <div className="relative z-10 hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                    <TrendingUp size={20} className="text-yellow-400" />
                    <div className="leading-tight">
                        <p className="text-white text-xs font-semibold">Sistem Aktif</p>
                        <p className="text-blue-200 text-xs">Semua sistem berjalan</p>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Pengguna"
                    value={stats?.total_users ?? 0}
                    icon={Users}
                    accent="#6366f1"
                    trend="+5%"
                />
                <StatCard
                    label="Total Pengiriman"
                    value={stats?.total_shipments ?? 0}
                    icon={Package}
                    accent="#F6C343"
                    trend="+12%"
                />
                <StatCard
                    label="Driver Aktif"
                    value={stats?.active_drivers ?? 0}
                    icon={Truck}
                    accent="#10b981"
                />
                <StatCard
                    label="Menunggu Pengiriman"
                    value={stats?.pending_deliveries ?? 0}
                    icon={Clock}
                    accent="#f59e0b"
                />
            </div>

            {/* ── Content Sections ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Shipments */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Pengiriman Terbaru</h3>
                        <span className="text-xs text-gray-400 font-medium">Lihat semua</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div
                            className="flex items-center justify-center rounded-full mb-3"
                            style={{ width: 48, height: 48, backgroundColor: '#F6C34322' }}
                        >
                            <Package size={22} style={{ color: '#F6C343' }} strokeWidth={1.8} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Belum ada pengiriman</p>
                        <p className="text-xs text-gray-400 mt-1">Data akan muncul di sini</p>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Aktivitas Terkini</h3>
                        <span className="text-xs text-gray-400 font-medium">Lihat semua</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div
                            className="flex items-center justify-center rounded-full mb-3"
                            style={{ width: 48, height: 48, backgroundColor: '#6366f122' }}
                        >
                            <TrendingUp size={22} style={{ color: '#6366f1' }} strokeWidth={1.8} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Belum ada aktivitas</p>
                        <p className="text-xs text-gray-400 mt-1">Aktivitas sistem akan tampil di sini</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
