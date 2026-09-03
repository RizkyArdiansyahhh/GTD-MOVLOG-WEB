import { useState } from 'react';
import { Check, Plus, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { SessionStage, FieldWorker, MovementItem } from '../types';
import { STAGE_LABELS } from '../types';
import AddMovementModal from './AddMovementModal';
import MovementReportModal from './MovementReportModal';

interface StageStepperProps {
    sessionId: string;
    stages: SessionStage[];
    fieldWorkers: FieldWorker[];
}

export default function StageStepper({ sessionId, stages }: StageStepperProps) {
    return (
        <div className="space-y-3">
            {stages.map((stage, idx) => (
                <StageCard
                    key={stage.id || idx}
                    stage={stage}
                    sessionId={sessionId}
                    isLast={idx === stages.length - 1}
                />
            ))}
        </div>
    );
}

interface StageCardProps {
    stage: SessionStage;
    sessionId: string;
    isLast: boolean;
}

function StageCard({ stage, sessionId }: StageCardProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals state
    const [isAddMovementOpen, setIsAddMovementOpen] = useState(false);
    const [selectedMovementForReport, setSelectedMovementForReport] = useState<MovementItem | null>(null);

    const label = STAGE_LABELS[stage.stage_type] || stage.stage_name || stage.stage_type.toUpperCase();
    const isSelesai = stage.status === 'selesai';
    const isAktif = stage.status === 'aktif';
    const isPending = stage.status === 'pending';

    const movements = stage.movements || [];
    const completedCount = stage.completed_movement_count ?? 0;
    const totalCount = stage.total_movement_count ?? 0;
    const isReadyToComplete = Boolean(stage.is_ready_to_complete);
    const canComplete = isAktif && stage.pic_user !== null && isReadyToComplete;

    const handleComplete = () => {
        if (!confirm(`Selesaikan Tahap ${label}? Sesi logistik akan otomatis berlanjut ke tahap berikutnya.`)) {
            return;
        }
        setIsSubmitting(true);
        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/complete`,
            {},
            { onFinish: () => setIsSubmitting(false), preserveScroll: true }
        );
    };

    const handleDeleteMovement = (mov: MovementItem) => {
        if (!confirm(`Hapus armada '${mov.movement_name}'?`)) return;
        router.delete(`/sesi-pekerja/${sessionId}/movements/${mov.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <div
            className={`rounded-xl border transition-all ${
                isAktif
                    ? 'bg-white border-[#06283A] shadow-xs'
                    : isSelesai
                    ? 'bg-slate-50/60 border-slate-200'
                    : 'bg-white/80 border-slate-200'
            }`}
        >
            <div className="p-3.5 space-y-3">
                {/* ── Stage Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                isSelesai
                                    ? 'bg-emerald-600 text-white'
                                    : isAktif
                                    ? 'bg-[#06283A] text-[#F5B800]'
                                    : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                            {isSelesai ? <Check size={12} strokeWidth={3} /> : stage.stage_order}
                        </span>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-[#06283A]">
                                    Tahap {stage.stage_order}: {label}
                                </h3>
                                <span
                                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                        isSelesai
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : isAktif
                                            ? 'bg-amber-50 text-[#06283A] border border-amber-300 font-bold'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {isSelesai ? 'Selesai' : isAktif ? 'Sedang Berjalan' : 'Menunggu'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                {stage.pic_user ? (
                                    <span>
                                        PIC: <strong className="font-semibold text-[#06283A]">{stage.pic_user.name}</strong>
                                    </span>
                                ) : (
                                    <span className="text-slate-400">PIC belum ditentukan</span>
                                )}

                                {isSelesai && stage.completed_at && (
                                    <span>
                                        &middot; Selesai {new Date(stage.completed_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Header Action: Complete Stage Button */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {canComplete && (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#06283A] bg-[#F5B800] hover:bg-[#E5AC00] shadow-xs transition-all cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Tahap & Lanjut'}</span>
                            </button>
                        )}

                        {isAktif && totalCount > 0 && !canComplete && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {completedCount} / {totalCount} Laporan Selesai
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Read-Only Informational Template Snapshot ── */}
                {stage.template_snapshot && isAktif && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <FileText size={12} className="text-slate-400" />
                            <span>Template:</span>
                            <strong className="text-[#06283A]">{stage.template_snapshot.template_name || 'Standard'}</strong>
                        </div>
                        <span className="text-slate-400">
                            {(stage.template_snapshot.fields?.length || 0)} fields &bull; {(stage.template_snapshot.photo_slots?.length || 0)} foto wajib
                        </span>
                    </div>
                )}

                {/* ── Movements Content ── */}
                {isAktif ? (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                {stage.movement_label} ({movements.length})
                            </span>

                            {stage.can_add_movement && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddMovementOpen(true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#06283A] bg-[#F5B800] hover:bg-[#E5AC00] rounded-lg shadow-2xs transition-all cursor-pointer"
                                >
                                    <Plus size={12} />
                                    Tambah {stage.stage_order === 1 ? 'Tongkang' : 'Truk'}
                                </button>
                            )}
                        </div>

                        {movements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {movements.map((mov) => (
                                    <div
                                        key={mov.id}
                                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-[#06283A] truncate">
                                                    {mov.movement_name}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                                        mov.is_completed
                                                            ? 'bg-emerald-50 text-emerald-800'
                                                            : mov.report_status === 'in_progress'
                                                            ? 'bg-amber-50 text-[#06283A]'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {mov.is_completed
                                                        ? 'Laporan Selesai'
                                                        : mov.report_status === 'in_progress'
                                                        ? 'Dalam Proses'
                                                        : 'Belum Lapor'}
                                                </span>
                                            </div>
                                            {mov.parent_name && (
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    Asal: <span className="text-[#06283A] font-semibold">{mov.parent_name}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMovementForReport(mov)}
                                                className="px-2.5 py-1 text-xs font-semibold text-[#06283A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                            >
                                                {mov.is_completed ? 'Lihat Laporan' : 'Isi Laporan'}
                                            </button>

                                            {stage.can_add_movement && !mov.is_completed && mov.report_status === 'not_started' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMovement(mov)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                                    title="Hapus armada"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-3 px-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
                                {stage.can_add_movement
                                    ? `Belum ada armada fisik didaftarkan. Klik "+ Tambah" untuk mendaftarkan armada.`
                                    : `Menunggu kelanjutan armada dari tahap sebelumnya.`}
                            </div>
                        )}
                    </div>
                ) : isSelesai && movements.length > 0 ? (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500">
                            Armada Terdaftar:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {movements.map((mov) => (
                                <span
                                    key={mov.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-[#06283A]"
                                >
                                    <span>{mov.movement_name}</span>
                                    <span className="text-emerald-600 text-[10px] font-bold">✓ Selesai</span>
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ── Modals ── */}
            <AddMovementModal
                sessionId={sessionId}
                stage={stage}
                isOpen={isAddMovementOpen}
                onClose={() => setIsAddMovementOpen(false)}
            />

            {selectedMovementForReport && (
                <MovementReportModal
                    sessionId={sessionId}
                    stage={stage}
                    movement={selectedMovementForReport}
                    isOpen={Boolean(selectedMovementForReport)}
                    onClose={() => setSelectedMovementForReport(null)}
                />
            )}
        </div>
    );
}
