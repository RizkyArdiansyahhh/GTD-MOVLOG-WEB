import { useState } from 'react';
import { Check, Lock, AlertCircle, ChevronDown, ChevronUp, Clock, User, Users } from 'lucide-react';
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
                    prevStageName={idx > 0 ? (STAGE_LABELS[stages[idx - 1].stage_type] || stages[idx - 1].stage_name || stages[idx - 1].stage_type) : null}
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
    const [workerIds, setWorkerIds] = useState<string[]>(stage.workers ? stage.workers.map((w) => w.id) : []);
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
            {
                pic_user_id: picUserId,
                worker_ids: workerIds,
            },
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

                {/* Connecting Line */}
                {!isLast && (
                    <div
                        className={`w-0.5 my-1 grow min-h-12 transition-colors ${
                            isSelesai ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                    />
                )}
            </div>

            {/* Content Card */}
            <div className={`grow pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div
                    className={`rounded-2xl border transition-all ${
                        isAktif
                            ? 'border-amber-300 bg-amber-50/20 shadow-sm ring-1 ring-amber-100 p-5'
                            : isSelesai
                            ? 'border-emerald-200 bg-emerald-50/20 p-5'
                            : 'border-slate-200 bg-slate-50/50 p-4 opacity-75'
                    }`}
                >
                    {/* Header: Stage Name + Status Badge */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#06283A]">
                                Tahap {stage.stage_order}: {label}
                            </h3>
                        </div>

                        {/* Status Badge */}
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isSelesai
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isAktif
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            {isSelesai ? 'Selesai' : isAktif ? 'Sedang Berjalan' : 'Menunggu'}
                        </span>
                    </div>

                    {/* -- STATE: SELESAI -- */}
                    {isSelesai && (
                        <div className="mt-3 text-xs text-slate-600 space-y-1.5 border-t border-emerald-100 pt-3">
                            <div className="flex items-center gap-2">
                                <User size={13} className="text-slate-400" />
                                <span>
                                    PIC:{' '}
                                    <strong className="text-slate-700 font-semibold">
                                        {stage.pic_user?.name || '-'}
                                    </strong>
                                </span>
                            </div>
                            {stage.workers && stage.workers.length > 0 && (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Users size={13} className="text-slate-400" />
                                    <span>Workers: {stage.workers.map((w) => w.name).join(', ')}</span>
                                </div>
                            )}
                            {stage.completed_at && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={13} />
                                    <span>
                                        Selesai:{' '}
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

                    {/* -- STATE: AKTIF -- */}
                    {isAktif && (
                        <div className="mt-4 space-y-4">
                            {/* Alert if not yet assigned */}
                            {needsAssignment && (
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-100/70 border border-amber-200 text-xs text-amber-900">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700" />
                                    <div>
                                        <strong>Assignment Belum Lengkap.</strong> Tentukan Petugas PIC untuk tahap ini agar pekerjaan dapat diselesaikan.
                                    </div>
                                </div>
                            )}

                            {/* Current PIC & Workers display */}
                            {stage.pic_user && (
                                <div className="p-3 rounded-xl bg-white border border-amber-200/60 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-slate-500 font-medium">Petugas PIC:</div>
                                        <div className="font-bold text-[#06283A] flex items-center gap-1.5">
                                            <User size={13} className="text-amber-600" />
                                            <span>{stage.pic_user.name}</span>
                                        </div>
                                    </div>
                                    {stage.workers && stage.workers.length > 0 && (
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                                            <div className="text-slate-500 font-medium">Workers:</div>
                                            <div className="font-medium text-slate-700 flex items-center gap-1.5">
                                                <Users size={13} className="text-slate-400" />
                                                <span>{stage.workers.map((w) => w.name).join(', ')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Assignment / Reassignment Form */}
                            <div className="space-y-3 p-3.5 rounded-xl bg-white border border-slate-200">
                                <div className="text-xs font-bold text-[#06283A]">
                                    {stage.pic_user ? 'Ubah Petugas (PIC & Worker)' : 'Tugaskan Petugas (PIC & Worker)'}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                        Petugas PIC <span className="text-red-500">*</span>
                                    </label>
                                    <FieldWorkerSelect
                                        fieldWorkers={fieldWorkers}
                                        value={picUserId}
                                        onChange={setPicUserId}
                                        placeholder="-- Pilih Petugas PIC --"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                        Anggota Worker (Opsional)
                                    </label>
                                    <WorkerMultiSelect
                                        fieldWorkers={fieldWorkers}
                                        value={workerIds}
                                        onChange={setWorkerIds}
                                        placeholder="-- Pilih Pekerja Lapangan Tambahan --"
                                    />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAssign}
                                        disabled={!picUserId || isSubmitting}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06283A] text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}
                                    </button>
                                </div>
                            </div>

                            {/* Complete Button */}
                            <div className="pt-1 flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    {canComplete
                                        ? 'Klik tombol di samping jika tahap ini sudah tuntas.'
                                        : 'Lengkapi assignment PIC terlebih dahulu untuk menyelesaikan.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={!canComplete || isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                                >
                                    <Check size={14} strokeWidth={2.5} />
                                    <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Tahap Ini'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* -- STATE: PENDING -- */}
                    {isPending && (
                        <div className="mt-2">
                            {/* Collapsible pre-plan trigger */}
                            <button
                                type="button"
                                onClick={() => setIsPrePlanOpen(!isPrePlanOpen)}
                                className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-600 hover:text-[#06283A] transition-colors py-1"
                            >
                                <span>
                                    {stage.pic_user
                                        ? `Pra-penugasan: PIC ${stage.pic_user.name}`
                                        : 'Pra-tugaskan PIC & Worker (Opsional)'}
                                </span>
                                {isPrePlanOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* Collapsible pre-plan form */}
                            {isPrePlanOpen && (
                                <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                            Petugas PIC
                                        </label>
                                        <FieldWorkerSelect
                                            fieldWorkers={fieldWorkers}
                                            value={picUserId}
                                            onChange={setPicUserId}
                                            placeholder="-- Pilih Petugas PIC --"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                                            Anggota Worker
                                        </label>
                                        <WorkerMultiSelect
                                            fieldWorkers={fieldWorkers}
                                            value={workerIds}
                                            onChange={setWorkerIds}
                                            placeholder="-- Pilih Pekerja Lapangan Tambahan --"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={handleAssign}
                                            disabled={!picUserId || isSubmitting}
                                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06283A] text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pra-Penugasan'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] text-slate-400 mt-2">
                                Tahap ini akan aktif secara otomatis setelah tahap {prevStageName || 'sebelumnya'} selesai.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
