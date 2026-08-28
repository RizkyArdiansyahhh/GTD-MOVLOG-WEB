import { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import type {
    CustomerCompany,
    CustomerStats,
    ShipmentSummary,
    CheckpointOverviewGroup,
} from '@/types/customer';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    XCircle,
    Package,
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
    checkpointGroups?: CheckpointOverviewGroup[];
}

export default function Dashboard({
    customer,
    stats,
    recentShipments = [],
}: DashboardProps) {
    useRealtimeUpdates(customer?.id);

    const [greeting, setGreeting] = useState('Selamat Datang');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            setGreeting('Selamat Pagi');
        } else if (hour >= 11 && hour < 15) {
            setGreeting('Selamat Siang');
        } else if (hour >= 15 && hour < 18) {
            setGreeting('Selamat Sore');
        } else {
            setGreeting('Selamat Malam');
        }
    }, []);

    // Check if any shipments currently have exception/cancellation status
    const exceptionShipments = useMemo(() => {
        return recentShipments.filter((s) => {
            const st = (s.status || '').toUpperCase();
            return st === 'CANCELLED' || st === 'DIBATALKAN';
        });
    }, [recentShipments]);

    // Format semantic status badge (Clean text style without heavy pill backgrounds)
    const renderStatusBadge = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'IN_PROGRESS' || s === 'IN_TRANSIT' || s === 'DALAM PERJALANAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>Dalam Perjalanan</span>
                </span>
            );
        }
        if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'TERKIRIM') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Terkirim</span>
                </span>
            );
        }
        if (s === 'CANCELLED' || s === 'DIBATALKAN') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>Dibatalkan</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Persiapan Muat</span>
            </span>
        );
    };

    return (
        <CustomerLayout title="Dashboard Pelanggan">
            <Head title="Dashboard — GTD Customer Portal" />

            <div className="space-y-6">
                {/* ── 1. Hero Greeting ── */}
                <div className="pb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#06283A]">
                        {greeting},{' '}
                        <span className="text-slate-800">
                            {customer?.company_name || customer?.pic_name || 'PT Customer A'}
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                        Berikut adalah ringkasan logistik dan pengiriman aktif Anda hari ini.
                    </p>
                </div>

                {/* ── 2. Top Split Workstation: Left Action Cards + Right Metrics & Table ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column (Highlight & Action Cards) - 4 Cols */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Card 1: Tracking Posisi Armada (Clean outline icon, no pastel box) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between min-h-[175px]">
                            <div>
                                <Compass size={24} className="text-blue-600 mb-3" strokeWidth={1.8} />
                                <h3 className="font-bold text-sm sm:text-base text-[#06283A]">
                                    Tracking Posisi Armada
                                </h3>
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                    Pantau koordinat transit, status pos perjalanan, dan estimasi waktu sampai terkini secara langsung.
                                </p>
                            </div>
                            <div className="pt-3.5 mt-2 border-t border-slate-100">
                                <Link
                                    href="/customer/monitoring-barang"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-yellow-600 transition-colors uppercase tracking-wider group"
                                >
                                    <span>Buka Monitoring</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Status Operasional Normal / Attention Card (Clean outline icon) */}
                        {exceptionShipments.length > 0 ? (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1.5">
                                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                                    <span>Perlu Perhatian</span>
                                </div>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    Terdapat {exceptionShipments.length} pengiriman yang dibatalkan atau membutuhkan koordinasi:
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
                                        Status Operasional Normal
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                        Semua armada pengiriman aktif beroperasi sesuai jadwal dan rute yang telah ditentukan.
                                    </p>
                                </div>
                                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] font-medium text-emerald-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                    <span>Pembaruan otomatis aktif</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Connected 3-Metrics Row + Recent Shipments Table) - 8 Cols */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        {/* Connected 3-Metrics Baris Bersambung with Thin Vertical Dividers */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                {/* Metric 1: Pengiriman Aktif */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Pengiriman Aktif
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums">
                                            {Number(stats?.active_shipments ?? 0).toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">armada</span>
                                    </div>
                                </div>

                                {/* Metric 2: Terkirim 7 Hari */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Terkirim (7 Hari)
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums">
                                            {Number(stats?.completed_last_7d ?? 0).toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">selesai</span>
                                    </div>
                                </div>

                                {/* Metric 3: Total Kargo Dikelola */}
                                <div className="p-4 sm:p-5">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                        Total Kargo
                                    </span>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-bold text-[#06283A] tracking-tight tabular-nums truncate">
                                            {Number(stats?.total_cargo_tonnage ?? 0).toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">akumulasi</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Shipments Table Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-sm sm:text-base text-[#06283A]">
                                    Pengiriman Terbaru
                                </h2>
                                <Link
                                    href="/customer/monitoring-barang"
                                    className="text-xs font-semibold text-slate-600 hover:text-[#06283A] uppercase tracking-wider transition-colors inline-flex items-center gap-1 group"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">ID Pengiriman</th>
                                            <th className="py-3 px-4">Tujuan / Rute</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">ETA</th>
                                            <th className="py-3 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-normal">
                                        {recentShipments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-slate-400">
                                                    <p className="font-semibold text-slate-600">Belum ada pengiriman aktif saat ini.</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Semua data sesi kargo akan otomatis tampil di sini.</p>
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
                                                            Asal {shipment.origin}
                                                        </div>
                                                    </td>

                                                    {/* Status (Clean text style) */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {renderStatusBadge(shipment.status)}
                                                    </td>

                                                    {/* ETA */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <span className="font-medium text-slate-800">
                                                            {shipment.eta || '-'}
                                                        </span>
                                                    </td>

                                                    {/* Detail CTA */}
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <Link
                                                            href={`/customer/shipment/${shipment.id}`}
                                                            className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
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

                {/* ── 3. Bottom Row: Aktivitas Terbaru (8 Cols) + Butuh Bantuan (4 Cols) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Aktivitas Terbaru (8 Columns) */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h2 className="font-bold text-sm sm:text-base text-[#06283A]">
                                Aktivitas Terbaru
                            </h2>
                            <Link
                                href="/customer/monitoring-barang"
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                            >
                                <span>Riwayat Lengkap</span>
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
                                                Armada #{s.assignment_no} — {s.current_checkpoint || 'Pos Operasional'}
                                            </p>
                                            <p className="text-slate-600 text-[11px] leading-relaxed">
                                                Muatan {s.cargo_name} dalam proses transit rute {s.origin} menuju {s.destination}. Estimasi tiba {s.eta}.
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase">
                                                Status: {s.status === 'IN_PROGRESS' || s.status === 'IN_TRANSIT' ? 'Dalam Perjalanan' : s.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic py-3">Belum ada aktivitas tercatat.</p>
                            )}

                            {/* Verified Document Notification Item */}
                            <div className="flex items-start gap-3 text-xs pt-2 border-t border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <div className="flex-1 space-y-0.5">
                                    <p className="font-semibold text-slate-900">
                                        Document Vault &amp; Legalitas Aktif
                                    </p>
                                    <p className="text-slate-600 text-[11px] leading-relaxed">
                                        Surat jalan, manifest, dan berita acara kargo yang telah disetujui Supervisor dapat langsung diunduh di halaman detail pengiriman.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Butuh Bantuan Card (4 Columns) - Dark Navy Card */}
                    <div className="lg:col-span-4 bg-[#0F172A] rounded-xl p-6 text-white flex flex-col justify-between shadow-sm min-h-[220px]">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight text-white mb-2">
                                Butuh Bantuan?
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                Layanan dukungan pelanggan kami tersedia 24/7 untuk memantau pengiriman Anda dan membantu kendala operasional.
                            </p>
                        </div>

                        <div className="mt-5 space-y-2.5">
                            {/* Action 1: WhatsApp Account Manager */}
                            <a
                                href="https://wa.me/6281234567890?text=Halo%20GTD%2C%20saya%20ingin%20koordinasi%20pengiriman%20kargo"
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
                                        <p className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                                            Hubungi Account Manager
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            RESPONS CEPAT &lt; 15 MENIT
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
