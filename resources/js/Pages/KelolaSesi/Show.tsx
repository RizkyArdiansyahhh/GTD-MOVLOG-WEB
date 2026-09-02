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
    const pageProps = usePage<{ session?: WorkSession; fieldWorkers?: FieldWorker[] }>().props;
    const session = propSession || pageProps.session;
    const fieldWorkers = propFieldWorkers || pageProps.fieldWorkers || [];

    if (!session) {
        return (
            <DashboardLayout>
                <Head title="Session Detail - GTD Logistics" />
                <div className="flex items-center justify-center py-20 text-slate-400">
                    Session not found.
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
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#06283A]">
                            Session Detail{' '}
                            <span className="font-mono text-[#F5B800]">{session.sessionId}</span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Manage logistics stages and officer assignment for this session.
                        </p>
                    </div>
                </div>

                {/* ── Session Info Card ── */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-4">
                    {/* Units */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5B800]">
                                <Package size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-[#06283A]">Heavy Equipment Units</h2>
                        </div>
                        {session.units && session.units.length > 0 ? (
                            <p className="text-sm text-slate-600">
                                {session.units.map((unit, idx) => (
                                    <span key={unit.id || idx}>
                                        {idx > 0 && <span className="mx-1.5 text-slate-300">&middot;</span>}
                                        {unit.unit_name}{' '}<span className="text-slate-400">&times;{unit.quantity}</span>
                                    </span>
                                ))}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400">No units added yet.</p>
                        )}
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
                        Logistics Stage Progress
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
