import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { WorkSession, FieldWorker } from './types';
import StageStepper from './components/StageStepper';
import TeamAssignmentCard from './components/TeamAssignmentCard';

interface ShowProps {
    session: WorkSession;
    fieldWorkers: FieldWorker[];
}

export default function KelolaSesiShow({ session: propSession, fieldWorkers: propFieldWorkers }: ShowProps) {
    const pageProps = usePage<{ session?: WorkSession; fieldWorkers?: FieldWorker[] }>().props;
    const session = propSession || pageProps.session;
    const fieldWorkers = propFieldWorkers || pageProps.fieldWorkers || [];

    if (!session) {
        return (
            <DashboardLayout>
                <Head title="Detail Sesi - GTD Logistics" />
                <div className="flex items-center justify-center py-20 text-slate-400">
                    Sesi tidak ditemukan.
                </div>
            </DashboardLayout>
        );
    }

    const isSessionDelivered = session.status === 'delivered' || session.status === 'selesai';
    const activeStage = session.stages?.find((s) => s.status === 'aktif');

    return (
        <DashboardLayout>
            <Head title={`Detail Sesi ${session.sessionId} - GTD Logistics`} />

            <div className="w-full max-w-7xl mx-auto space-y-4">
                {/* ── Top Bar ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/sesi-pekerja"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#06283A] hover:bg-slate-50 transition-colors shadow-2xs"
                            title="Kembali ke Kelola Sesi"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-[#06283A]">
                                    Detail Sesi {session.sessionId}
                                </h1>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                        isSessionDelivered
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-amber-50 text-[#06283A] border border-amber-300'
                                    }`}
                                >
                                    {isSessionDelivered
                                        ? 'DELIVERED (SELESAI)'
                                        : activeStage
                                        ? `Aktif: ${activeStage.stage_name}`
                                        : 'Dalam Pengiriman'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Monitoring pergerakan kargo dan penugasan tim lapangan
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Main 2-Column Responsive Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Left Column (5 Cols on LG): Session Info & Team Assignment Card */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* 1. Unit & Cargo Detail Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="pb-2 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-[#06283A] uppercase tracking-wide">
                                    Informasi Kargo & Unit
                                </h2>
                                <p className="text-[11px] text-slate-500">Manifest muatan yang dikirimkan</p>
                            </div>

                            {/* Units List */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                                    Daftar Unit Alat Berat
                                </span>
                                {session.units && session.units.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {session.units.map((unit, idx) => (
                                            <span
                                                key={unit.id || idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-[#06283A]"
                                            >
                                                <span>{unit.unit_name}</span>
                                                <span className="text-amber-600 font-extrabold">&times;{unit.quantity}</span>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Belum ada data unit.</p>
                                )}
                            </div>

                            {/* Notes */}
                            {session.notes && (
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-0.5">
                                        Catatan Sesi
                                    </span>
                                    <p className="text-xs text-[#06283A] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {session.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 2. Unified Team Assignment (PIC) Card */}
                        <TeamAssignmentCard
                            sessionId={session.id}
                            stages={session.stages || []}
                            fieldWorkers={fieldWorkers}
                        />
                    </div>

                    {/* Right Column (7 Cols on LG): Stage Stepper & Movements */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="pb-3 mb-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-[#06283A] uppercase tracking-wide">
                                    Alur Operasional & Monitoring Checkpoint
                                </h2>
                                <p className="text-[11px] text-slate-500">
                                    Pantau pergerakan fisik armada dan kelengkapan bukti dokumentasi
                                </p>
                            </div>

                            <StageStepper
                                sessionId={session.id}
                                stages={session.stages || []}
                                fieldWorkers={fieldWorkers}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
