import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import { Users, Package, Truck, Clock, ArrowUpRight } from 'lucide-react';

interface DashboardStats {
    total_users?: number;
    total_shipments?: number;
    active_drivers?: number;
    pending_deliveries?: number;
}

interface RecentSession {
    id: string | number;
    assignment_no?: string;
    cargo_name?: string;
    origin?: string | null;
    destination?: string | null;
    status?: string;
    created_at?: string;
    customer?: { id: string | number; company_name: string } | null;
    current_checkpoint?: { id: number; name: string } | null;
}

interface DashboardProps extends PageProps {
    stats?: DashboardStats;
    recentSessions?: RecentSession[];
}

export default function Index({ stats, recentSessions = [] }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;

    const statCards = [
        {
            label: 'Total User Accounts',
            value: stats?.total_users ?? 0,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
        },
        {
            label: 'Total Shipments',
            value: stats?.total_shipments ?? 0,
            icon: Package,
            color: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Active Drivers',
            value: stats?.active_drivers ?? 0,
            icon: Truck,
            color: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: 'Pending Shipments',
            value: stats?.pending_deliveries ?? 0,
            icon: Clock,
            color: 'bg-purple-50 text-purple-600',
        },
    ];

    const getStatusBadge = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'delivered' || s === 'completed' || s === 'selesai') {
            return (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium border border-emerald-100">
                    Selesai
                </span>
            );
        }
        if (s === 'in_transit' || s === 'in_progress') {
            return (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
                    Dalam Perjalanan
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-100">
                {status || 'Pending'}
            </span>
        );
    };

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            <div
                className="p-6 flex flex-col gap-6"
                style={{
                    minHeight: '100%',
                    backgroundColor: '#F5F7FA',
                    fontFamily: "'Poppins', sans-serif",
                }}
            >
                {/* ── Welcome Banner ── */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#06283A]">
                            Welcome, {auth.user?.name ?? 'User'} 👋
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Sistem Informasi Monitoring Operational Logistics (GTD-MOVLOG)
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 self-start md:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>System Operating Normally</span>
                    </div>
                </div>

                {/* ── Stat Cards Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">{card.label}</span>
                                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                                        <Icon size={20} strokeWidth={2} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline justify-between">
                                    <span className="text-2xl font-bold text-[#06283A]">
                                        {card.value.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Dashboard Quick Sections ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ringkasan Activity */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-[#06283A]">Recent Shipment Activity</h2>
                        </div>
                        {recentSessions.length > 0 ? (
                            <div className="space-y-3">
                                {recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {session.assignment_no ? `Sesi #${session.assignment_no}` : `Sesi #${session.id}`}
                                                {session.cargo_name ? ` • ${session.cargo_name}` : ''}
                                            </p>
                                            <p className="text-slate-500 mt-0.5">
                                                {session.origin || '-'} → {session.destination || '-'}
                                                {session.current_checkpoint?.name ? ` • ${session.current_checkpoint.name}` : ''}
                                            </p>
                                        </div>
                                        <div>{getStatusBadge(session.status)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                Belum ada aktivitas sesi pengiriman terbaru.
                            </div>
                        )}
                    </div>

                    {/* Quick Access */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="font-semibold text-[#06283A] mb-4">Quick Navigation</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href="/monitoring-barang"
                                    className="p-4 rounded-xl border border-slate-200/80 hover:border-[#F6C343] hover:bg-amber-50/30 transition-all flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-[#06283A] group-hover:text-amber-700">Cargo Monitoring</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Track cargo status</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-amber-600" />
                                </a>
                                <a
                                    href="/laporan"
                                    className="p-4 rounded-xl border border-slate-200/80 hover:border-[#F6C343] hover:bg-amber-50/30 transition-all flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-[#06283A] group-hover:text-amber-700">Reports</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Download report data</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-amber-600" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
