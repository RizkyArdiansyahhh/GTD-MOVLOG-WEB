import { useState } from 'react';
import { Check, Lock, AlertCircle, ChevronDown, ChevronUp, Clock, Users, User } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { SessionStage, FieldWorker, StageType } from '../types';
import { STAGE_LABELS } from '../types';
import FieldWorkerSelect from './FieldWorkerSelect';
import WorkerMultiSelect from './WorkerMultiSelect';

interface StageStepperProps {
    sessionId: string;
    stages: SessionStage[];
    fieldWorkers: FieldWorker[];
}

export default function StageStepper({ sessionId, stages, fieldWorkers }: StageStepperProps) {
    return (
        <div className="space-y-0">
            {stages.map((stage, idx) => (
                <StageItem
                    key={stage.id}
                    stage={stage}
                    sessionId={sessionId}
                    fieldWorkers={fieldWorkers}
                    isLast={idx === stages.length - 1}
                    prevStageName={idx > 0 ? STAGE_LABELS[stages[idx - 1].stage_type] : null}
                />
            ))}
        </div>
    );
}

interface StageItemProps {
    stage: SessionStage;
    sessionId: string;
    fieldWorkers: FieldWorker[];
    isLast: boolean;
    prevStageName: string | null;
}

function StageItem({ stage, sessionId, fieldWorkers, isLast, prevStageName }: StageItemProps) {
    const [picUserId, setPicUserId] = useState(stage.pic_user?.id || '');
    const [workerIds, setWorkerIds] = useState<string[]>(stage.workers.map((w) => w.id));
    const [isPrePlanOpen, setIsPrePlanOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const label = STAGE_LABELS[stage.stage_type];
    const isSelesai = stage.status === 'selesai';
    const isAktif = stage.status === 'aktif';
    const isPending = stage.status === 'pending';

    const needsAssignment = isAktif && (!stage.pic_user || stage.workers.length === 0);
    const canComplete = isAktif && stage.pic_user !== null && stage.workers.length > 0;

    const handleAssign = () => {
        if (!picUserId || workerIds.length === 0) return;
        setIsSubmitting(true);
        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/assign`,
            { pic_user_id: picUserId, worker_ids: workerIds },
            {
                onFinish: () => setIsSubmitting(false),
                preserveScroll: true,
            }
        );
    };

    const handleComplete = () => {
        setIsSubmitting(true);
        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/complete`,
            {},
            {
                onFinish: () => setIsSubmitting(false),
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="flex gap-4">
            {/* Timeline Column */}
            <div className="flex flex-col items-center shrink-0" style={{ width: '32px' }}>
                {/* Node */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelesai
                            ? 'bg-emerald-500 text-white'
                            : isAktif
                            ? 'bg-[#F5B800] text-white ring-4 ring-amber-100'
                            : 'bg-slate-200 text-slate-400'
                    }`}
                >
                    {isSelesai ? (
                        <Check size={16} strokeWidth={3} />
                    ) : isAktif ? (
                        <span className="text-xs font-bold">{stage.stage_order}</span>
                    ) : (
                        <Lock size={14} />
                    )}
                </div>
                {/* Connector */}
                {!isLast && (
                    <div
                        className="w-0.5 flex-1 min-h-[24px]"
                        style={{
                            backgroundColor: isSelesai ? '#10B981' : '#E2E8F0',
                        }}
                    />
                )}
            </div>

            {/* Content Column */}
            <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <h3
                        className={`text-sm font-bold ${
                            isSelesai
                                ? 'text-emerald-700'
                                : isAktif
                                ? 'text-[#06283A]'
                                : 'text-slate-400'
                        }`}
                    >
                        {label}
                    </h3>
                    {isSelesai && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 uppercase">
                            Selesai
                        </span>
                    )}
                    {isAktif && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700 uppercase">
                            Aktif
                        </span>
                    )}
                    {isAktif && needsAssignment && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-semibold text-red-600">
                            <AlertCircle size={10} />
                            Perlu di-assign
                        </span>
                    )}
                    {isPending && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-500 uppercase">
                            Terkunci
                        </span>
                    )}
                </div>

                {/* ── SELESAI: Read-only summary ── */}
                {isSelesai && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <User size={12} />
                            <span className="font-semibold">PIC:</span>
                            <span>{stage.pic_user?.name || '-'}</span>
                        </div>
                        {stage.workers.length > 0 && (
                            <div className="flex items-start gap-2 text-xs text-emerald-700">
                                <Users size={12} className="mt-0.5" />
                                <span className="font-semibold shrink-0">Worker:</span>
                                <span>{stage.workers.map((w) => w.name).join(', ')}</span>
                            </div>
                        )}
                        {stage.completed_at && (
                            <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                                <Clock size={10} />
                                <span>Selesai: {new Date(stage.completed_at).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── AKTIF: Inline assignment form ── */}
                {isAktif && (
                    <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-4 space-y-4">
                        {/* Show current assignment or form */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                    Petugas PIC <span className="text-red-500">*</span>
                                </label>
                                <FieldWorkerSelect
                                    fieldWorkers={fieldWorkers}
                                    value={picUserId}
                                    onChange={(id) => setPicUserId(id)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                    Worker <span className="text-red-500">*</span>
                                </label>
                                <WorkerMultiSelect
                                    fieldWorkers={fieldWorkers}
                                    value={workerIds}
                                    onChange={setWorkerIds}
                                    disabled={isSubmitting}
                                    placeholder="Pilih worker untuk tahap ini..."
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2 border-t border-amber-100">
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={isSubmitting || !picUserId || workerIds.length === 0}
                                className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] bg-white text-[#06283A] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Assignment'}
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={isSubmitting || !canComplete}
                                className="px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: canComplete ? '#F5B800' : '#E2E8F0',
                                    color: canComplete ? '#06283A' : '#94A3B8',
                                }}
                            >
                                {isSubmitting ? 'Memproses...' : `Selesaikan Tahap ${label}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PENDING: Locked state ── */}
                {isPending && (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Lock size={12} />
                            Terkunci — menunggu tahap {prevStageName || 'sebelumnya'} selesai
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsPrePlanOpen((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            {isPrePlanOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isPrePlanOpen ? 'Tutup' : 'Isi sekarang (pre-plan)'}
                        </button>

                        {isPrePlanOpen && (
                            <div className="bg-slate-50/60 border border-[#E2E8F0] rounded-xl p-4 space-y-3 mt-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                        Petugas PIC
                                    </label>
                                    <FieldWorkerSelect
                                        fieldWorkers={fieldWorkers}
                                        value={picUserId}
                                        onChange={(id) => setPicUserId(id)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                                        Worker
                                    </label>
                                    <WorkerMultiSelect
                                        fieldWorkers={fieldWorkers}
                                        value={workerIds}
                                        onChange={setWorkerIds}
                                        disabled={isSubmitting}
                                        placeholder="Pilih worker..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={isSubmitting || !picUserId || workerIds.length === 0}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] bg-white text-[#06283A] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pre-plan'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
