import { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Truck, Anchor } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { FieldWorker } from './types';
import FieldWorkerSelect from './components/FieldWorkerSelect';
import WorkerMultiSelect from './components/WorkerMultiSelect';
import UnitListInput from './components/UnitListInput';
import type { UnitItem } from './components/UnitListInput';

interface KelolaSesiCreateProps {
    fieldWorkers?: FieldWorker[];
}

export default function KelolaSesiCreate({ fieldWorkers: propFieldWorkers }: KelolaSesiCreateProps) {
    const pageProps = usePage<{ fieldWorkers?: FieldWorker[] }>().props;

    const availableFieldWorkers = useMemo(() => {
        if (Array.isArray(propFieldWorkers) && propFieldWorkers.length > 0) {
            return propFieldWorkers;
        }
        if (Array.isArray(pageProps.fieldWorkers) && pageProps.fieldWorkers.length > 0) {
            return pageProps.fieldWorkers;
        }
        return [];
    }, [propFieldWorkers, pageProps.fieldWorkers]);

    const [idSesi, setIdSesi] = useState('');
    const [units, setUnits] = useState<UnitItem[]>([{ unit_name: '', quantity: 1 }]);
    const [kapalPicUserId, setKapalPicUserId] = useState('');
    const [kapalWorkerIds, setKapalWorkerIds] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isUnitsValid = units.every((u) => u.unit_name.trim() !== '' && u.quantity >= 1);
    const isKapalAssigned = kapalPicUserId.trim() !== '' && kapalWorkerIds.length > 0;
    const canSubmit =
        idSesi.trim() !== '' &&
        isUnitsValid &&
        isKapalAssigned &&
        availableFieldWorkers.length > 0 &&
        !isSubmitting;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);

        router.post(
            '/sesi-pekerja',
            {
                id_sesi: idSesi,
                units: units as any,
                kapal_pic_user_id: kapalPicUserId,
                kapal_worker_ids: kapalWorkerIds,
                notes: notes,
            },
            {
                onFinish: () => setIsSubmitting(false),
            }
        );
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
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#06283A]">
                            Create New Worker Session
                        </h1>
                        <p className="text-xs text-slate-500">
                            Fill in session details and first stage assignment (Vessel).
                        </p>
                    </div>
                </div>

                {/* ── Main Form Container ── */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* ── Section 1: Identitas Sesi ── */}
                    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5B800]">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-[#06283A]">Heavy Equipment Session Data</h2>
                                <p className="text-xs text-slate-400">Main session identity information</p>
                            </div>
                        </div>

                        {/* ID Sesi */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                Session ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={idSesi}
                                onChange={(e) => setIdSesi(e.target.value)}
                                placeholder="Example: SES-2048"
                                required
                                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-mono font-semibold text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                            />
                        </div>

                        {/* Unit List */}
                        <UnitListInput
                            units={units}
                            onChange={setUnits}
                            disabled={isSubmitting}
                        />

                        {/* Catatan */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                Additional Notes
                            </label>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Write any specific notes about the location or unit session conditions..."
                                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all"
                            />
                        </div>
                    </div>

                    {/* ── Section 2: Vessel Stage Assignment ── */}
                    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-500">
                                <Anchor size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-[#06283A]">
                                    Vessel Stage Assignment
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Required — first stage starts automatically when session is created
                                </p>
                            </div>
                        </div>

                        {/* PIC */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                Vessel PIC Officer <span className="text-red-500">*</span>
                            </label>
                            <FieldWorkerSelect
                                fieldWorkers={availableFieldWorkers}
                                value={kapalPicUserId}
                                onChange={(id) => setKapalPicUserId(id)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {/* Workers */}
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                Vessel Workers <span className="text-red-500">*</span>
                            </label>
                            <WorkerMultiSelect
                                fieldWorkers={availableFieldWorkers}
                                value={kapalWorkerIds}
                                onChange={setKapalWorkerIds}
                                disabled={isSubmitting}
                                placeholder="Select workers for Vessel stage..."
                            />
                        </div>

                        {!isKapalAssigned && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl">
                                <span>PIC and at least 1 worker must be assigned for the Vessel stage.</span>
                            </div>
                        )}
                    </div>

                    {/* ── Form Action Buttons ── */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href="/sesi-pekerja"
                            className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#F5B800',
                                color: '#06283A',
                            }}
                        >
                            <Save size={18} />
                            <span>{isSubmitting ? 'Saving...' : 'Save Session'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
