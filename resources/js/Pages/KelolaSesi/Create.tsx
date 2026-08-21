import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { LogisticsStage } from './types';

const STAGE_OPTIONS: LogisticsStage[] = ['Kapal', 'Tongkang', 'Pelabuhan', 'Site'];

export default function KelolaSesiCreate() {
    const [idSesi, setIdSesi] = useState('');
    const [unitName, setUnitName] = useState('');
    const [petugas, setPetugas] = useState('');
    const [initialStage, setInitialStage] = useState<LogisticsStage>('Kapal');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulated submit behavior
        setTimeout(() => {
            setIsSubmitting(false);
            router.visit('/sesi-pekerja');
        }, 500);
    };

    return (
        <DashboardLayout>
            <Head title="Buat Sesi Baru - GTD Logistics" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* ── Top Bar with Back Link & Title ── */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/sesi-pekerja"
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#06283A]">
                            Buat Sesi Pekerja Baru
                        </h1>
                        <p className="text-xs text-slate-500">
                            Isi formulir untuk menambahkan sesi pekerjaan alat berat baru.
                        </p>
                    </div>
                </div>

                {/* ── Main Form Container ── */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 sm:p-8 space-y-6"
                >
                    {/* Header Badge */}
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5B800]">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-[#06283A]">Data Sesi Alat Berat</h2>
                            <p className="text-xs text-slate-400">Informasi utama identitas dan penanggung jawab sesi</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* ID Sesi (Manual input) */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                ID Sesi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={idSesi}
                                onChange={(e) => setIdSesi(e.target.value)}
                                placeholder="Contoh: SES-2048"
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-mono font-semibold text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                            />
                        </div>

                        {/* Petugas Penanggung Jawab (Manual input) */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                Petugas Penanggung Jawab <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={petugas}
                                onChange={(e) => setPetugas(e.target.value)}
                                placeholder="Contoh: Budi S."
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                            />
                        </div>
                    </div>

                    {/* Nama Unit */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                            Nama & Model Unit <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={unitName}
                            onChange={(e) => setUnitName(e.target.value)}
                            placeholder="Contoh: Excavator CAT 320 / Dump Truck HD465"
                            required
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                        />
                    </div>

                    {/* Tahap Logistik Awal */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">
                            Tahap Logistik Awal <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {STAGE_OPTIONS.map((stage) => {
                                const isSelected = initialStage === stage;
                                return (
                                    <button
                                        key={stage}
                                        type="button"
                                        onClick={() => setInitialStage(stage)}
                                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                                            isSelected
                                                ? 'border-[#F5B800] bg-amber-50/60 text-[#06283A] font-bold shadow-xs'
                                                : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{stage}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Catatan Tambahan */}
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                            Catatan Tambahan
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tuliskan catatan khusus terkait lokasi atau kondisi sesi unit..."
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                        />
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Link
                            href="/sesi-pekerja"
                            className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !idSesi.trim() || !unitName.trim() || !petugas.trim()}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#F5B800',
                                color: '#06283A',
                            }}
                        >
                            <Save size={18} />
                            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Sesi'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
