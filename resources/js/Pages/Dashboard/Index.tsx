import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

interface DashboardStats {
    total_users: number;
    total_shipments: number;
    active_drivers: number;
    pending_deliveries: number;
}

interface DashboardProps extends PageProps {
    stats: DashboardStats;
}

const StatCard = ({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number | string;
    icon: string;
    color: string;
}) => (
    <div className={`rounded-xl border bg-slate-900 border-slate-800 p-6 hover:border-${color}-500/50 transition-all duration-200`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-400 text-sm font-medium">{label}</p>
                <p className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 flex items-center justify-center text-2xl`}>
                {icon}
            </div>
        </div>
    </div>
);

export default function Index({ stats }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Welcome Banner */}
            <div className="rounded-xl bg-linear-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-6 mb-6">
                <h2 className="text-xl font-semibold text-white">
                    Welcome back, {auth.user.name} 👋
                </h2>
                <p className="text-slate-400 mt-1 text-sm">
                    Here's what's happening in your logistics network today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Users"
                    value={stats?.total_users ?? 0}
                    icon="👥"
                    color="indigo"
                />
                <StatCard
                    label="Total Shipments"
                    value={stats?.total_shipments ?? 0}
                    icon="📦"
                    color="blue"
                />
                <StatCard
                    label="Active Drivers"
                    value={stats?.active_drivers ?? 0}
                    icon="🚛"
                    color="emerald"
                />
                <StatCard
                    label="Pending Deliveries"
                    value={stats?.pending_deliveries ?? 0}
                    icon="⏳"
                    color="amber"
                />
            </div>

            {/* Placeholder sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
                    <h3 className="font-semibold text-white mb-4">Recent Shipments</h3>
                    <p className="text-slate-500 text-sm">No recent shipments yet.</p>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
                    <h3 className="font-semibold text-white mb-4">Activity Feed</h3>
                    <p className="text-slate-500 text-sm">No recent activity.</p>
                </div>
            </div>
        </AppLayout>
    );
}
