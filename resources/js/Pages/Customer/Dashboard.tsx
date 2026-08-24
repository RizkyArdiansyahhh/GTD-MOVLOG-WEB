import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CustomerCompany, CustomerStats, ShipmentSummary } from '@/types/customer';
import {
    MapPin,
    ArrowRight,
    History,
    Headphones,
    BookOpen,
    Send,
    ChevronRight,
    CheckCircle2,
    Package,
    Truck,
    Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    time_ago: string;
    type: string;
    badge_color?: 'yellow' | 'blue' | 'green';
}

interface DashboardProps {
    company: CustomerCompany;
    stats: CustomerStats & { in_transit?: number };
    recent_shipments: ShipmentSummary[];
    activities?: ActivityItem[];
}

export default function Dashboard({ company, stats, recent_shipments, activities }: DashboardProps) {
    const [greeting, setGreeting] = useState('Selamat Pagi');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi');
        else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');
    }, []);

    // Fallback activities if none passed from props
    const activityFeed: ActivityItem[] = activities && activities.length > 0 ? activities : [
        {
            id: 'act-1',
            title: 'Manifest Berhasil Diunggah',
            description: 'Dokumen pengiriman #LTR-88304 telah diverifikasi oleh admin. Proses pemuatan di pelabuhan asal dapat segera dimulai.',
            time_ago: '10 Menit yang lalu',
            type: 'document',
            badge_color: 'yellow',
        },
        {
            id: 'act-2',
            title: 'Armada Memasuki Checkpoint 4',
            description: 'Unit DT-104 (Barge Titan 2) tiba di Area Transit Pelabuhan Merak. Estimasi keberangkatan menuju tujuan akhir pukul 19:00.',
            time_ago: '1 Jam yang lalu',
            type: 'checkpoint',
            badge_color: 'blue',
        },
        {
            id: 'act-3',
            title: 'Pengiriman Selesai',
            description: 'Muatan Batubara 5000MT telah dibongkar di Site PLTU Suralaya. Bukti penyerahan barang (POD) tersedia untuk diunduh.',
            time_ago: 'Kemarin, 16:45',
            type: 'complete',
            badge_color: 'green',
        },
    ];

    const getStatusBadge = (status: string, label?: string) => {
        const text = (label || status || '').toUpperCase();
        if (text.includes('PERJALANAN') || text.includes('IN_PROGRESS')) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                    Dalam Perjalanan
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
        if (text.includes('TERKIRIM') || text.includes('COMPLETED') || text.includes('SELESAI')) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Terkirim
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                {label || status}
            </span>
        );
    };

    return (
        <CustomerLayout title="Dashboard Tracking">
            <Head title="Dashboard — Global Trans Djaya" />

            {/* ── Top Greeting Header ── */}
            <div className="mb-6">
                <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wider mb-1">
                    Customer Portal
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {greeting}, <span className="text-gray-900">{company?.company_name || 'Sejahtera Jaya'}</span> 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                    Berikut adalah ringkasan logistik dan pengiriman aktif Anda hari ini.
                </p>
            </div>

            {/* ── Main Top Grid: Left (Tracking Posisi) + Right (3 Metric Cards & Pengiriman Terbaru) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-start">
                
                {/* Left Column: Quick Action Card (Tracking Posisi) */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full min-h-[190px]">
                        <div>
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
                                style={{ backgroundColor: '#6366f122' }}
                            >
                                <MapPin size={20} style={{ color: '#6366f1' }} strokeWidth={2} />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800">Tracking Posisi</h3>
                            <p className="text-xs text-gray-500 leading-relaxed mt-1.5 font-normal">
                                Pantau koordinat armada dan estimasi waktu sampai terkini.
                            </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-gray-100">
                            <Link
                                href="/customer/monitoring-barang"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-600 hover:text-yellow-700 uppercase tracking-wider group transition-colors"
                            >
                                <span>Buka Monitoring</span>
                                <ArrowRight size={13} strokeWidth={2.2} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: 3 Metric Cards + Pengiriman Terbaru Table */}
                <div className="lg:col-span-9 flex flex-col gap-4">
                    
                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Card 1: Pengiriman Aktif */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: '#F6C34322' }}
                                >
                                    <Package size={20} style={{ color: '#F6C343' }} strokeWidth={2} />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    +3 Aktif
                                </span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">
                                    {stats?.active_shipments ?? 10}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Pengiriman Aktif</p>
                            </div>
                        </div>

                        {/* Card 2: Dalam Perjalanan */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: '#6366f122' }}
                                >
                                    <Truck size={20} style={{ color: '#6366f1' }} strokeWidth={2} />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    Armada Aktif
                                </span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">
                                    {stats?.in_transit ?? 3}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Dalam Perjalanan</p>
                            </div>
                        </div>

                        {/* Card 3: Terkirim (7 Hari) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: '#10b98122' }}
                                >
                                    <CheckCircle2 size={20} style={{ color: '#10b981' }} strokeWidth={2} />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    Selesai
                                </span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">
                                    {stats?.completed_shipments ?? 15}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Terkirim (7 Hari)</p>
                            </div>
                        </div>
                    </div>

                    {/* Pengiriman Terbaru Table Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800 text-base">Pengiriman Terbaru</h2>
                            <Link
                                href="/customer/monitoring-barang"
                                className="text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
                            >
                                Lihat semua
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400">
                                        <th className="pb-3 font-semibold">ID Pengiriman</th>
                                        <th className="pb-3 font-semibold">Tujuan</th>
                                        <th className="pb-3 font-semibold text-center">Status</th>
                                        <th className="pb-3 font-semibold">ETA</th>
                                        <th className="pb-3 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {recent_shipments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">
                                                <div
                                                    className="flex items-center justify-center rounded-full mb-3 mx-auto"
                                                    style={{ width: 48, height: 48, backgroundColor: '#F6C34322' }}
                                                >
                                                    <Package size={22} style={{ color: '#F6C343' }} strokeWidth={1.8} />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">Belum ada pengiriman</p>
                                                <p className="text-xs text-gray-400 mt-1">Data akan muncul di sini</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_shipments.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                                                {/* ID & Cargo Name */}
                                                <td className="py-3.5 pr-3">
                                                    <div className="font-semibold text-gray-900 font-mono text-xs">
                                                        #{s.assignment_no}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 truncate max-w-[130px]">
                                                        {s.cargo_name}
                                                    </div>
                                                </td>

                                                {/* Destination */}
                                                <td className="py-3.5 pr-3">
                                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium truncate max-w-[200px]">
                                                        <Send size={12} className="text-gray-400 shrink-0" />
                                                        <span className="truncate">{s.destination}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        Dari: {s.origin}
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5 px-2 text-center whitespace-nowrap">
                                                    {getStatusBadge(s.status, s.status_label)}
                                                </td>

                                                {/* ETA */}
                                                <td className="py-3.5 pr-3 text-gray-500 whitespace-nowrap font-medium text-xs">
                                                    {s.eta || s.updated_at || 'Hari ini, 14:00'}
                                                </td>

                                                {/* Action Button */}
                                                <td className="py-3.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={`/customer/monitoring-barang/${s.id}`}
                                                        className="px-3 py-1 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors inline-block"
                                                    >
                                                        Detail
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

            {/* ── Bottom Grid: Aktivitas Terbaru (Left) & Butuh Bantuan (Right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Aktivitas Terbaru Card */}
                <div className="lg:col-span-7 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-gray-800 text-base">Aktivitas Terbaru</h2>
                        <div className="flex items-center gap-1 text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-600 transition-colors">
                            <span>Riwayat lengkap</span>
                            <History size={13} />
                        </div>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                        {activityFeed.map((act) => {
                            let dotColor = 'bg-yellow-400';
                            if (act.badge_color === 'blue') dotColor = 'bg-indigo-500';
                            if (act.badge_color === 'green') dotColor = 'bg-emerald-500';

                            return (
                                <div key={act.id} className="relative">
                                    <span className={`absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white`} />
                                    <h4 className="text-xs font-semibold text-gray-900 leading-snug">
                                        {act.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
                                        {act.description}
                                    </p>
                                    <span className="text-[11px] font-medium text-gray-400 mt-1.5 block">
                                        {act.time_ago}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Butuh Bantuan Card (Dark Navy GTD Gradient) */}
                <div
                    className="lg:col-span-5 rounded-2xl text-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    }}
                >
                    {/* Decorative gold circle */}
                    <div
                        className="absolute right-0 top-0 rounded-full opacity-10 pointer-events-none"
                        style={{
                            width: 200,
                            height: 200,
                            background: '#F6C343',
                            transform: 'translate(30%, -30%)',
                        }}
                    />

                    <div className="relative z-10">
                        <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-1">
                            Bantuan Pelanggan
                        </p>
                        <h2 className="text-xl font-bold text-white tracking-tight">Butuh Bantuan?</h2>
                        <p className="text-xs text-blue-200 mt-1.5 leading-relaxed font-normal">
                            Layanan dukungan pelanggan kami tersedia 24/7 untuk memantau pengiriman Anda dan membantu kendala operasional.
                        </p>

                        <div className="space-y-3 mt-6">
                            {/* Hubungi Account Manager Button */}
                            <a
                                href="https://wa.me/6281234567890"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
                                        <Headphones size={17} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-white group-hover:text-yellow-300 transition-colors">
                                            Hubungi Account Manager
                                        </div>
                                        <div className="text-[10px] text-blue-200 font-medium tracking-wide">
                                            Respons Cepat &lt; 15 Menit
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={15} className="text-blue-200 group-hover:text-yellow-300 group-hover:translate-x-0.5 transition-all" />
                            </a>

                            {/* Panduan Pengguna */}
                            <Link
                                href="/customer/checkpoints"
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
                                        <BookOpen size={17} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-white group-hover:text-yellow-300 transition-colors">
                                            Panduan Pengguna
                                        </div>
                                        <div className="text-[10px] text-blue-200 font-medium tracking-wide">
                                            Video Tutorial &amp; Dokumentasi
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={15} className="text-blue-200 group-hover:text-yellow-300 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                        <span>Layanan Monitoring Live</span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online 24/7
                        </span>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
