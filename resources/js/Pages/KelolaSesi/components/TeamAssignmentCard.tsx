import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import type { SessionStage, FieldWorker } from '../types';
import { STAGE_LABELS } from '../types';
import FieldWorkerSelect from './FieldWorkerSelect';

interface TeamAssignmentCardProps {
    sessionId: string;
    stages: SessionStage[];
    fieldWorkers: FieldWorker[];
}

export default function TeamAssignmentCard({
    sessionId,
    stages,
    fieldWorkers,
}: TeamAssignmentCardProps) {
    const [assignments, setAssignments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        stages.forEach((s) => {
            initial[s.id] = s.pic_user?.id || '';
        });
        return initial;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleWorkerChange = (stageId: string, workerId: string) => {
        setAssignments((prev) => ({ ...prev, [stageId]: workerId }));
        setSavedSuccess(false);
    };

    // Strict Validation: Every non-completed stage MUST have a PIC selected
    const unassignedStages = useMemo(() => {
        return stages.filter((s) => s.status !== 'selesai' && !assignments[s.id]);
    }, [stages, assignments]);

    const isAllAssigned = unassignedStages.length === 0;

    // Check if any change has been made compared to initial stage.pic_user
    const hasChanges = useMemo(() => {
        return stages.some((s) => (assignments[s.id] || '') !== (s.pic_user?.id || ''));
    }, [stages, assignments]);

    const handleSaveAll = (e: React.FormEvent) => {
        e.preventDefault();

        // Enforce strict check before submitting
        if (!isAllAssigned) {
            return;
        }

        setIsSaving(true);
        setSavedSuccess(false);

        router.post(
            `/sesi-pekerja/${sessionId}/assign-all`,
            { assignments },
            {
                onSuccess: () => {
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 3000);
                },
                onFinish: () => {
                    setIsSaving(false);
                },
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                    <h2 className="text-xs font-bold text-[#06283A] uppercase tracking-wide">
                        Penugasan Petugas PIC
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Tentukan penanggung jawab untuk masing-masing tahap
                    </p>
                </div>

                {savedSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Tersimpan
                    </span>
                )}
            </div>

            <form onSubmit={handleSaveAll} className="space-y-3">
                <div className="space-y-2">
                    {stages.map((stage) => {
                        const stageTitle =
                            STAGE_LABELS[stage.stage_type] || stage.stage_name || `Tahap ${stage.stage_order}`;
                        const isCompleted = stage.status === 'selesai';
                        const isSelected = Boolean(assignments[stage.id]);

                        return (
                            <div
                                key={stage.id}
                                className={`p-2.5 rounded-lg border transition-all ${
                                    isCompleted
                                        ? 'bg-slate-50/70 border-slate-200'
                                        : isSelected
                                        ? 'bg-white border-slate-200 hover:border-slate-300'
                                        : 'bg-amber-50/30 border-amber-200/80'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#06283A]">
                                            Tahap {stage.stage_order}: {stageTitle}
                                        </span>
                                        {!isCompleted && !isSelected && (
                                            <span className="text-[10px] text-rose-500 font-semibold">
                                                *Wajib diisi
                                            </span>
                                        )}
                                    </div>

                                    {isCompleted ? (
                                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                            Selesai
                                        </span>
                                    ) : stage.status === 'aktif' ? (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                            Aktif
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                            Menunggu
                                        </span>
                                    )}
                                </div>

                                {isCompleted ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-700 py-0.5">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            ✓
                                        </div>
                                        <span className="font-semibold text-[#06283A]">
                                            {stage.pic_user?.name || '-'}
                                        </span>
                                    </div>
                                ) : (
                                    <FieldWorkerSelect
                                        fieldWorkers={fieldWorkers}
                                        value={assignments[stage.id] || ''}
                                        onChange={(val) => handleWorkerChange(stage.id, val)}
                                        placeholder={`-- Pilih PIC ${stageTitle} --`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Validation Status & Strict Save Button */}
                <div className="pt-1 space-y-2">
                    {!isAllAssigned && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <AlertCircle size={14} className="shrink-0 text-amber-600" />
                            <span>
                                Pilih PIC untuk semua tahapan (<strong>{unassignedStages.length} belum ditentukan</strong>) agar penugasan lengkap.
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving || !isAllAssigned}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            isAllAssigned && !isSaving
                                ? 'bg-[#F5B800] hover:bg-[#E5AC00] text-[#06283A] shadow-xs cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        }`}
                    >
                        {isSaving ? (
                            'Menyimpan...'
                        ) : !isAllAssigned ? (
                            `Lengkapi PIC (${unassignedStages.length} Kosong)`
                        ) : (
                            'Simpan Semua Penugasan PIC'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
