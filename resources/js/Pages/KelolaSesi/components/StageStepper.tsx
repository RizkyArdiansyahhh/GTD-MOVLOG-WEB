import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, User, Users } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { SessionStage, FieldWorker } from '../types';
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
                    key={stage.id || idx}
                    stage={stage}
                    sessionId={sessionId}
                    fieldWorkers={fieldWorkers}
                    isLast={idx === stages.length - 1}
                    prevStageName={
                        idx > 0
                            ? (STAGE_LABELS[stages[idx - 1].stage_type] || stages[idx - 1].stage_name || stages[idx - 1].stage_type)
                            : null
                    }
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
    const [workerIds, setWorkerIds] = useState<string[]>(
        stage.workers ? stage.workers.map((w) => w.id) : []
    );
    const [isPrePlanOpen, setIsPrePlanOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const label = STAGE_LABELS[stage.stage_type] || stage.stage_name || stage.stage_type.toUpperCase();
    const isSelesai = stage.status === 'selesai';
    const isAktif = stage.status === 'aktif';
    const isPending = stage.status === 'pending';

    const needsAssignment = isAktif && !stage.pic_user;
    const canComplete = isAktif && stage.pic_user !== null;

    const handleAssign = () => {
        if (!picUserId) return;
        setIsSubmitting(true);
        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/assign`,
            { pic_user_id: picUserId, worker_ids: workerIds },
            { onFinish: () => setIsSubmitting(false), preserveScroll: true }
        );
    };

    const handleComplete = () => {
        setIsSubmitting(true);
        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/complete`,
            {},
            { onFinish: () => setIsSubmitting(false), preserveScroll: true }
        );
    };

    // ── Node & connector styles ─────────────────────────────────────────────
    const nodeStyle: React.CSSProperties = isSelesai
        ? {
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
          }
        : isAktif
        ? {
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#F5B800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(245, 184, 0, 0.22)',
          }
        : {
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: '1.5px solid #CBD5E1',
              flexShrink: 0,
          };

    const connectorColor = isSelesai ? '#10B981' : '#E2E8F0';

    return (
        <div
            className="flex gap-4"
            style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}
        >
            {/* ── Timeline Column ── */}
            <div className="flex flex-col items-center shrink-0" style={{ width: '22px' }}>
                {/* Circle node */}
                <div style={nodeStyle}>
                    {isSelesai && <Check size={13} strokeWidth={3} color="white" />}
                    {isAktif && (
                        <span
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                display: 'block',
                            }}
                        />
                    )}
                </div>

                {/* Vertical connector line */}
                {!isLast && (
                    <div
                        style={{
                            width: '2px',
                            backgroundColor: connectorColor,
                            flexGrow: 1,
                            minHeight: '36px',
                            marginTop: '4px',
                            transition: 'background-color 0.2s',
                        }}
                    />
                )}
            </div>

            {/* ── Content area — no card wrapper ── */}
            <div className={`grow ${isLast ? 'pb-0' : 'pb-6'}`}>
                {/* Header: Stage Name + Status text */}
                <div className="flex items-start justify-between gap-3" style={{ minHeight: '22px' }}>
                    <h3 className="text-sm font-semibold text-[#06283A] leading-5">
                        Stage {stage.stage_order}: {label}
                    </h3>

                    {/* Status as plain text — no pill */}
                    <span
                        className="text-xs shrink-0 mt-0.5"
                        style={{
                            color: isSelesai
                                ? '#10B981'
                                : isAktif
                                ? '#D97706'
                                : '#94A3B8',
                            fontWeight: isAktif ? 500 : 400,
                        }}
                    >
                        {isSelesai ? 'Completed' : isAktif ? 'In Progress' : 'Pending'}
                    </span>
                </div>

                {/* ── STATE: SELESAI ── */}
                {isSelesai && (
                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            <span>
                                PIC:{' '}
                                <strong className="text-slate-700 font-medium">
                                    {stage.pic_user?.name || '-'}
                                </strong>
                            </span>
                        </div>
                        {stage.workers && stage.workers.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Users size={12} className="text-slate-400" />
                                <span>Workers: {stage.workers.map((w) => w.name).join(', ')}</span>
                            </div>
                        )}
                        {stage.completed_at && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock size={12} />
                                <span>
                                    Completed:{' '}
                                    {new Date(stage.completed_at).toLocaleString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STATE: AKTIF ── */}
                {isAktif && (
                    <div className="mt-3 space-y-3">
                        {/* Inline warning text — replaces alert box */}
                        {needsAssignment && (
                            <p className="text-xs" style={{ color: '#D97706' }}>
                                Assign a PIC officer for this stage so the work can be completed.
                            </p>
                        )}

                        {/* Current PIC & Workers summary */}
                        {stage.pic_user && (
                            <div className="text-xs space-y-1 text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-slate-400" />
                                    <span>
                                        PIC:{' '}
                                        <strong className="text-slate-700 font-medium">
                                            {stage.pic_user.name}
                                        </strong>
                                    </span>
                                </div>
                                {stage.workers && stage.workers.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Users size={12} className="text-slate-400" />
                                        <span>
                                            Workers: {stage.workers.map((w) => w.name).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Assignment / Reassignment Form — thin border on form only */}
                        <div
                            className="space-y-3 p-3.5 rounded-xl bg-white"
                            style={{ border: '0.5px solid #E2E8F0' }}
                        >
                            <div className="text-xs font-semibold text-[#06283A]">
                                {stage.pic_user
                                    ? 'Update Officers (PIC & Workers)'
                                    : 'Assign Officers (PIC & Workers)'}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                    PIC Officer <span className="text-red-500">*</span>
                                </label>
                                <FieldWorkerSelect
                                    fieldWorkers={fieldWorkers}
                                    value={picUserId}
                                    onChange={setPicUserId}
                                    placeholder="-- Select PIC Officer --"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                    Worker Members (Optional)
                                </label>
                                <WorkerMultiSelect
                                    fieldWorkers={fieldWorkers}
                                    value={workerIds}
                                    onChange={setWorkerIds}
                                    placeholder="-- Select Additional Field Workers --"
                                />
                            </div>

                        </div>

                        {/* Validation hint + action buttons — right-aligned row */}
                        <div className="space-y-2">
                            {!canComplete && (
                                <p className="text-xs text-right" style={{ color: '#D97706' }}>
                                    Complete PIC assignment first to finalize this stage.
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleAssign}
                                    disabled={!picUserId || isSubmitting}
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        padding: '7px 14px',
                                        borderRadius: '6px',
                                        background: '#F8FAFC',
                                        color: '#475569',
                                        border: '1px solid #E2E8F0',
                                        cursor: !picUserId || isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: !picUserId || isSubmitting ? 0.4 : 1,
                                        transition: 'opacity 0.15s',
                                    }}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Assignment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={!canComplete || isSubmitting}
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        padding: '7px 14px',
                                        borderRadius: '6px',
                                        background: '#10B981',
                                        color: 'white',
                                        border: 'none',
                                        cursor: !canComplete || isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: !canComplete || isSubmitting ? 0.4 : 1,
                                        transition: 'opacity 0.15s',
                                    }}
                                >
                                    {isSubmitting ? 'Processing...' : 'Complete Stage'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STATE: PENDING ── */}
                {isPending && (
                    <div className="mt-1">
                        <p className="text-xs text-slate-400">
                            {stage.pic_user
                                ? `Pre-assignment: PIC ${stage.pic_user.name} — activates automatically after ${prevStageName || 'previous stage'} is completed.`
                                : `Pre-assign PIC & workers (optional) — activates automatically after ${prevStageName || 'previous stage'} is completed.`}
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsPrePlanOpen(!isPrePlanOpen)}
                            className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 hover:text-[#06283A] transition-colors"
                        >
                            <span>{isPrePlanOpen ? 'Close' : 'Pre-assign'}</span>
                            {isPrePlanOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isPrePlanOpen && (
                            <div
                                className="mt-3 p-3.5 rounded-xl bg-white space-y-3"
                                style={{ border: '0.5px solid #E2E8F0' }}
                            >
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                        Petugas PIC
                                    </label>
                                    <FieldWorkerSelect
                                        fieldWorkers={fieldWorkers}
                                        value={picUserId}
                                        onChange={setPicUserId}
                                        placeholder="-- Select PIC Officer --"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                        Worker Members
                                    </label>
                                    <WorkerMultiSelect
                                        fieldWorkers={fieldWorkers}
                                        value={workerIds}
                                        onChange={setWorkerIds}
                                        placeholder="-- Select Additional Field Workers --"
                                    />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAssign}
                                        disabled={!picUserId || isSubmitting}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06283A] text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Pre-Assignment'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
