import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Package, FileText } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { WorkSession, FieldWorker } from './types';
import StageStepper from './components/StageStepper';

interface ShowProps {
    session: WorkSession;
    fieldWorkers: FieldWorker[];
}

export default function KelolaSesiShow({ session: propSession, fieldWorkers: propFieldWorkers }: ShowProps) {
    const pageProps = usePage<{ session?: WorkSession; fieldWorkers?: FieldWorker[]; flash?: { success?: string } }>().props;
    const session = propSession || pageProps.session;
    const fieldWorkers = propFieldWorkers || pageProps.fieldWorkers || [];
    const flash = pageProps.flash;

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

    return (
        <DashboardLayout>
            <Head title={`Detail Sesi ${session.sessionId} - GTD Logistics`} />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* ── Top Bar ── */}
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
                            Detail Sesi{' '}
                            <span className="font-mono text-[#F5B800]">{session.sessionId}</span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Kelola tahap logistik dan assignment petugas untuk sesi ini.
                        </p>
                    </div>
                </div>

                {/* ── Flash Message ── */}
                {flash?.success && (
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {/* ── Session Info Card ── */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-4">
                    {/* Units */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5B800]">
                                <Package size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-[#06283A]">Unit Alat Berat</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {session.units && session.units.length > 0 ? (
                                session.units.map((unit, idx) => (
                                    <div
                                        key={unit.id || idx}
                                        className="flex items-center justify-between px-3 py-2 bg-slate-50/60 border border-[#E2E8F0] rounded-lg"
                                    >
                                        <span className="text-sm font-medium text-[#06283A]">
                                            {unit.unit_name}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                            ×{unit.quantity}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 col-span-2">Belum ada unit.</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                        <div className="flex items-start gap-2 pt-3 border-t border-slate-100">
                            <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-500">{session.notes}</p>
                        </div>
                    )}
                </div>

                {/* ── Stage Stepper ── */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6">
                    <h2 className="text-base font-bold text-[#06283A] mb-5">
                        Progress Tahap Logistik
                    </h2>
                    <StageStepper
                        sessionId={session.id}
                        stages={session.stages || []}
                        fieldWorkers={fieldWorkers}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
