import { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { PageHeader } from '@/Components/ui';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type {
    CustomerCompany,
    CustomerStats,
    ShipmentSummary,
} from '@/types/customer';
import {
    ArrowRight,
    ShieldCheck,
    AlertTriangle,
    MapPin,
    Compass,
    PhoneCall,
    ExternalLink,
} from 'lucide-react';

interface DashboardProps {
    customer: CustomerCompany;
    stats: CustomerStats;
    recentShipments: ShipmentSummary[];
}

export default function Dashboard({
    customer,
    stats,
    recentShipments = [],
}: DashboardProps) {
    useRealtimeUpdates(customer?.id);

    const [greeting, setGreeting] = useState('Welcome');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            setGreeting('Good Morning');
        } else if (hour >= 11 && hour < 15) {
            setGreeting('Good Afternoon');
        } else if (hour >= 15 && hour < 19) {
            setGreeting('Good Evening');
        } else {
            setGreeting('Good Night');
        }
    }, []);

    // Check if any shipments currently have exception/cancellation status
    const exceptionShipments = useMemo(() => {
        return recentShipments.filter((s) => {
            const st = (s.status || '').toUpperCase();
            return st === 'CANCELLED' || st === 'DIBATALKAN';
        });
    }, [recentShipments]);

    // Relative timestamp for the activity feed ("2h ago"). Falls back to
    // null when the backend did not provide a timestamp.
    const timeAgo = (iso: string | null | undefined): string | null => {
        if (!iso) return null;
        const then = new Date(iso).getTime();
        if (Number.isNaN(then)) return null;
        const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Format semantic status badge (Clean text style without heavy pill backgrounds)
    const renderStatusBadge = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'IN_PROGRESS' || s === 'IN_TRANSIT' || s === 'DALAM PERJALANAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700" aria-label="Status: In Transit">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>In Transit</span>
                </span>
            );
        }
        if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'TERKIRIM') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700" aria-label="Status: Delivered">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Delivered</span>
                </span>
            );
        }
        if (s === 'CANCELLED' || s === 'DIBATALKAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700" aria-label="Status: Cancelled">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>Cancelled</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Status: Loading Preparation">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Loading Preparation</span>
            </span>
        );
    };

    return (
        <CustomerLayout title="Customer Dashboard">
            <Head title="Dashboard — GTD Customer Portal" />

            <div className="space-y-6">
                {/* ── 1. Hero Greeting ── */}
                <PageHeader
                    title={
                        <span>
                            {greeting},{' '}
                            <span className="text-slate-800">
                                {customer?.company_name || customer?.pic_name || 'PT Customer A'}
                            </span>
                        </span>
                    }
                    subtitle="Here is your logistics summary and active shipments today."
                />

                {/* ── 2. Top Split Workstation: Left Action Cards + Right Metrics & Table ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column (Highlight & Action Cards) - 4 Cols */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Card 1: Fleet Position Tracking (primary action) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between min-h-[175px]">
                            <div>
                                <Compass size={24} className="text-blue-600 mb-3" strokeWidth={1.8} />
                                <h3 className="font-bold text-sm sm:text-base text-[#06283A]">
                                    Fleet Position Tracking
                                </h3>
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                    Monitor transit coordinates, journey checkpoint status, and real-time arrival estimates.
                                </p>
                            </div>
                            <div className="pt-3.5 mt-2">
                                <Link
                                    href="/customer/checkpoints"
                                    className="flex items-center justify-center gap-1.5 rounded-xl px-5 text-xs font-bold text-[#06283A] shadow-sm transition-all duration-200 hover:brightness-105 hover:shadow active:scale-[0.98]"
                                    style={{ height: 42, backgroundColor: '#F6C343' }}
                                >
                                    <span>Open Live Tracking</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Normal Operational Status / Attention Card (secondary, no CTA) */}
                        {exceptionShipments.length > 0 ? (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1.5">
                                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                                    <span>Needs Attention</span>
                                </div>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    {exceptionShipments.length} shipment{exceptionShipments.length > 1 ? 's' : ''} cancelled or requiring coordination:
                                </p>
                                <p className="text-xs font-bold text-amber-950 mt-1">
                                    {exceptionShipments.map((s) => `#${s.assignment_no}`).join(', ')}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between min-h-[175px]">
                                <div>
                                    <ShieldCheck size={24} className="text-emerald-600 mb-3" strokeWidth={1.8} />
                                    <h3 className="font-bold text-sm text-[#06283A]">
                                        Normal Operational Status
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        All active shipment fleets are operating according to schedule and designated routes.
                                    </p>
                                </div>
                                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] font-medium text-emerald-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Automatic updates active</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Connected 3-Metrics Row + Recent Shipments Table) - 8 Cols */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        {/* Connected 3-Metrics Baris Bersambung with Thin Vertical Dividers */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                {/* Metric 1: Active Shipments */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Active Shipments
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums">
                                            {Number(stats?.active_shipments ?? 0).toLocaleString('en-US')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">fleets</span>
                                    </div>
                                </div>

                                {/* Metric 2: Delivered in the last 7 days */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Delivered (7 Days)
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums">
                                            {Number(stats?.completed_last_7d ?? 0).toLocaleString('en-US')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">done</span>
                                    </div>
                                </div>

                                {/* Metric 3: Total cargo managed */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Total Cargo
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums">
                                            {Number(stats?.total_cargo_tonnage ?? 0).toLocaleString('en-US')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">MT</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Shipments Table Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-sm sm:text-base text-[#06283A]">
                                    Recent Shipments
                                </h2>
                                <Link
                                    href="/customer/checkpoints"
                                    className="text-xs font-medium text-slate-400 hover:text-[#06283A] transition-colors inline-flex items-center gap-1 group"
                                >
                                    <span>View all</span>
                                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Shipment ID</th>
                                            <th className="py-3 px-4">Destination / Route</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">ETA</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-normal">
                                        {recentShipments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-slate-400">
                                                    <p className="font-semibold text-slate-600">No active shipments at this time.</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">All cargo session data will automatically appear here.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            recentShipments.map((shipment) => (
                                                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                                                    {/* ID & Cargo */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="font-mono font-semibold text-xs text-[#06283A]">
                                                            #{shipment.assignment_no}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-normal">
                                                            {shipment.cargo_name}
                                                        </div>
                                                    </td>

                                                    {/* Route */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5 text-slate-800 text-xs font-medium max-w-[200px]">
                                                            <MapPin size={13} className="text-[#F6C343] shrink-0" />
                                                            <span className="truncate">{shipment.destination}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 pl-4 truncate font-normal">
                                                            From {shipment.origin}
                                                        </div>
                                                    </td>

                                                    {/* Status (Clean text style) */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderStatusBadge(shipment.status)}
                                                    </td>

                                                    {/* ETA */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <span className="font-normal text-slate-500">
                                                            {shipment.eta || '-'}
                                                        </span>
                                                    </td>

                                                    {/* Detail CTA */}
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <Link
                                                            href={`/customer/shipment/${shipment.id}`}
                                                            className="px-3 py-1 rounded-lg border border-slate-300 text-[#06283A] hover:bg-[#06283A] hover:text-white hover:border-[#06283A] text-[11px] font-bold transition-all inline-flex items-center gap-1"
                                                        >
                                                            <span>DETAIL</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. Bottom Row: Recent Activity (8 Cols) + Help (4 Cols) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Recent Activity (8 Columns) */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h2 className="font-bold text-sm sm:text-base text-[#06283A]">
                                Recent Activity
                            </h2>
                            <Link
                                href="/customer/checkpoints"
                                className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                            >
                                <span>Full history</span>
                                <ExternalLink size={12} />
                            </Link>
                        </div>

                        {/* Chronological Activity List */}
                        <div className="space-y-4">
                            {recentShipments.length > 0 ? (
                                recentShipments.slice(0, 3).map((s, idx) => (
                                    <div key={idx} className="flex items-start gap-3 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-[#F6C343] mt-1.5 shrink-0" />
                                        <div className="flex-1 space-y-0.5">
                                            <p className="font-semibold text-slate-900">
                                                Fleet #{s.assignment_no} — {s.current_checkpoint || 'Operations Post'}
                                            </p>
                                            <p className="text-slate-600 text-[11px] leading-relaxed">
                                                Cargo {s.cargo_name} in transit from {s.origin} to {s.destination}. Estimated arrival {s.eta}.
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase">
                                                {timeAgo(s.updated_at) ?? `Status: ${s.status === 'IN_PROGRESS' || s.status === 'IN_TRANSIT' ? 'In Transit' : s.status}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-3">No activity recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Help Card (4 Columns) - Dark Navy Card */}
                    <div className="lg:col-span-4 bg-[#0F172A] rounded-xl p-6 text-white flex flex-col justify-between shadow-sm min-h-[220px]">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight text-white mb-2">
                                Need Help?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                Our customer support team is available 24/7 to monitor your shipments and help with operational issues.
                            </p>
                        </div>

                        <div className="mt-5 space-y-2.5">
                            {/* Action 1: WhatsApp Account Manager */}
                            <a
                                href="https://wa.me/6281234567890?text=Hello%20GTD%2C%20I%20would%20like%20to%20coordinate%20cargo%20shipment"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5 text-left">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: '#F6C343', color: '#06283A' }}
                                    >
                                        <PhoneCall size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white group-hover:text-[#F6C343] transition-colors">
                                            Contact Account Manager
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            FAST RESPONSE &lt; 15 MIN
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight size={13} className="text-slate-400 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
