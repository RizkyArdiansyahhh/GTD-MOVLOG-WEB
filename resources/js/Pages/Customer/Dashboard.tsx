import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import type { CustomerCompany, CustomerStats, ShipmentSummary } from '@/types/customer';
import {
    FileText,
    MapPin,
    ArrowRight,
    ChevronRight,
    Send,
    History,
    Headphones,
    BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardProps {
    company: CustomerCompany;
    stats: CustomerStats;
    recent_shipments: ShipmentSummary[];
}

export default function Dashboard({ company, stats, recent_shipments }: DashboardProps) {
    const [greeting, setGreeting] = useState('Selamat Pagi');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi');
        else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');
    }, []);

    return (
        <CustomerLayout title="Dashboard Tracking">
            <Head title="Dashboard Tracking" />

            {/* Top Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {greeting}, <span className="text-slate-900">{company.company_name}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Berikut adalah ringkasan logistik dan pengiriman aktif Anda hari ini.
                    </p>
                </div>

                <div className="shrink-0">
                    <Link
                        href="/customer/monitoring-barang"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                        <span>MONITORING BARANG</span>
                        <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                </div>
            </div>

            {/* Main Top Grid (Left action cards + Right stats & recent table) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* Left Column: Quick Navigation Cards */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Dokumen Resmi Card */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between flex-1">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={18} className="text-slate-700 shrink-0" strokeWidth={1.75} />
                                <h3 className="text-sm font-semibold text-slate-900">Dokumen Resmi</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Unduh manifest, surat jalan, dan dokumen verifikasi resmi berstatus verified secara digital.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <Link
                                href="/customer/monitoring-barang"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                            >
                                <span>Lihat Dokumen</span>
                                <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Tracking Posisi Card */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between flex-1">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={18} className="text-slate-700 shrink-0" strokeWidth={1.75} />
                                <h3 className="text-sm font-semibold text-slate-900">Tracking Posisi</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Pantau koordinat armada kargo dan estimasi waktu transit terkini di pos operasional GTD.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <Link
                                href="/customer/monitoring-barang"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 group"
                            >
                                <span>Buka Monitoring</span>
                                <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Joined Stat Row + Pengiriman Terbaru Table */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Joined 3 Metric Row */}
                    <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="flex-1 px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                            <div className="text-[22px] font-medium text-slate-900 leading-tight">
                                {stats.active_shipments}
                            </div>
                            <div className="text-[12px] text-slate-500 mt-1">
                                Pengiriman Aktif
                            </div>
                        </div>

                        <div className="flex-1 px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-200">
                            <div className="text-[22px] font-medium text-slate-900 leading-tight">
                                {stats.active_shipments}
                            </div>
                            <div className="text-[12px] text-slate-500 mt-1">
                                Dalam Perjalanan
                            </div>
                        </div>

                        <div className="flex-1 px-5 py-3.5">
                            <div className="text-[22px] font-medium text-slate-900 leading-tight">
                                {stats.completed_shipments}
                            </div>
                            <div className="text-[12px] text-slate-500 mt-1">
                                Terkirim
                            </div>
                        </div>
                    </div>

                    {/* Pengiriman Terbaru Table Card */}
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-slate-900">Pengiriman Terbaru</h2>
                            <Link
                                href="/customer/monitoring-barang"
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-wider"
                            >
                                LIHAT SEMUA
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-3">ID PENGIRIMAN</th>
                                        <th className="pb-3">TUJUAN</th>
                                        <th className="pb-3 min-w-[260px]">TAHAP SAAT INI</th>
                                        <th className="pb-3">UPDATE</th>
                                        <th className="pb-3 text-right">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {recent_shipments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                                                Belum ada pengiriman kargo terbaru.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_shipments.map((s) => {
                                            const isDone = s.is_completed || s.status?.toLowerCase() === 'completed';
                                            const checkpoints = s.checkpoints || [];

                                            return (
                                                <tr
                                                    key={s.id}
                                                    className={`hover:bg-slate-50/70 transition-colors ${
                                                        isDone ? 'opacity-55' : ''
                                                    }`}
                                                >
                                                    <td className="py-3.5 pr-3">
                                                        <div className="font-semibold text-slate-900">
                                                            #{s.assignment_no}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                                            {s.cargo_name}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 pr-3">
                                                        <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[160px]">
                                                            <Send size={11} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">{s.destination}</span>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 pr-3">
                                                        {isDone ? (
                                                            <div className="text-[12px] font-medium text-emerald-600">
                                                                Selesai — diterima di {s.destination || 'site'}
                                                            </div>
                                                        ) : checkpoints.length > 0 ? (
                                                            <div>
                                                                {/* Mini Stepper Stage Text */}
                                                                <div className="flex items-center gap-1.5 flex-wrap text-[11px] leading-tight">
                                                                    {checkpoints.map((cp, idx) => (
                                                                        <div key={cp.id || idx} className="flex items-center gap-1.5">
                                                                            <span
                                                                                className={
                                                                                    cp.is_active
                                                                                        ? 'font-medium text-amber-600'
                                                                                        : 'font-normal text-slate-400'
                                                                                }
                                                                            >
                                                                                {cp.name}
                                                                            </span>
                                                                            {idx < checkpoints.length - 1 && (
                                                                                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* 4 Mini Progress Segments */}
                                                                <div className="flex items-center gap-[3px] mt-1.5 w-full max-w-[280px]">
                                                                    {checkpoints.map((cp, idx) => {
                                                                        let segmentColor = 'bg-slate-200';
                                                                        if (cp.is_completed) {
                                                                            segmentColor = 'bg-emerald-500';
                                                                        } else if (cp.is_active) {
                                                                            segmentColor = 'bg-amber-500';
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={cp.id || idx}
                                                                                className={`h-[3px] rounded-[2px] flex-1 ${segmentColor}`}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[11px] text-amber-600 font-medium">
                                                                {s.current_checkpoint || 'Dalam Perjalanan'}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap font-medium text-[11px]">
                                                        {s.updated_at}
                                                    </td>

                                                    <td className="py-3.5 text-right whitespace-nowrap">
                                                        <Link
                                                            href={`/customer/monitoring-barang/${s.id}`}
                                                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors inline-block"
                                                        >
                                                            Detail
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Aktivitas Terbaru (Left) & Butuh Bantuan (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Aktivitas Terbaru Card */}
                <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 shadow-xs p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-slate-900">Aktivitas Terbaru</h2>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium uppercase tracking-wider">
                            <span>Riwayat Lengkap</span>
                            <History size={14} />
                        </div>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                        {/* Event 1 */}
                        <div className="relative">
                            <span className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                            <h4 className="text-xs font-semibold text-slate-900">
                                Manifest & Dokumen Kargo Berhasil Diverifikasi
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Dokumen pengiriman GTD-ASN-2026-001 telah diverifikasi oleh PIC operasional GTD. Tongkang siap melanjutkan pelayaran.
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1.5 block">
                                10 MENIT YANG LALU
                            </span>
                        </div>

                        {/* Event 2 */}
                        <div className="relative">
                            <span className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                            <h4 className="text-xs font-semibold text-slate-900">
                                Armada Memasuki Checkpoint Transit Alur Sungai
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Armada kargo tiba di Area Transit Sungai / Muara. Estimasi waktu tempuh menuju lokasi bongkar terpantau lancar.
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1.5 block">
                                1 JAM YANG LALU
                            </span>
                        </div>

                        {/* Event 3 */}
                        <div className="relative">
                            <span className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                            <h4 className="text-xs font-semibold text-slate-900">
                                Pengiriman Selesai Dibongkar di Site Tujuan
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Muatan batubara 12.000 MT telah selesai dibongkar di Site PLTU. Berkas BAST & Draft Survey final tersedia untuk diunduh.
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1.5 block">
                                KEMARIN, 16:45
                            </span>
                        </div>
                    </div>
                </div>

                {/* Butuh Bantuan Card (Dark Navy `#0f1d2e`) */}
                <div className="lg:col-span-5 rounded-2xl bg-[#0f1d2e] text-white p-6 shadow-md flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Butuh Bantuan?</h2>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            Layanan operasional logistik kami siap memantau pengiriman Anda dan membantu kendala operasional 24/7.
                        </p>

                        <div className="space-y-3 mt-6">
                            {/* Hubungi PIC / AM Button Card */}
                            <Link
                                href="/customer/monitoring-barang"
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center shrink-0">
                                        <Headphones size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                                            Hubungi Account Manager / PIC
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            RESPONS CEPAT OPERASIONAL
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                            </Link>

                            {/* Panduan Tracking Kargo */}
                            <Link
                                href="/customer/checkpoints"
                                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center shrink-0">
                                        <BookOpen size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                                            Panduan Alur Checkpoint
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            INFORMASI TAHAPAN LOGISTIK
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Dispatcher GTD Live</span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online 24/7
                        </span>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
