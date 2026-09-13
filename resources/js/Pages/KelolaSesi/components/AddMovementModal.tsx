import { useState } from 'react';
import { X, Ship, Truck, AlertCircle, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { SessionStage } from '../types';

interface AddMovementModalProps {
    sessionId: string;
    stage: SessionStage;
    isOpen: boolean;
    onClose: () => void;
}

export default function AddMovementModal({ sessionId, stage, isOpen, onClose }: AddMovementModalProps) {
    const isStep1 = stage.stage_order === 1;
    const isStep3 = stage.stage_order === 3;

    const [movementName, setMovementName] = useState('');
    const [parentMovementId, setParentMovementId] = useState(
        stage.available_parents && stage.available_parents.length === 1
            ? stage.available_parents[0].id
            : ''
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!movementName.trim()) {
            setErrorMessage('Fleet name / movement identity is required.');
            return;
        }

        if (isStep3 && !parentMovementId) {
            setErrorMessage('Truck fleet must select the source Barge fleet.');
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/sesi-pekerja/${sessionId}/stages/${stage.id}/movements`,
            {
                movement_name: movementName.trim(),
                parent_movement_id: isStep3 ? parentMovementId : null,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setMovementName('');
                    onClose();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setErrorMessage(errors.movement || errors.stage || 'Failed to register fleet.');
                },
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F6C343]">
                            {isStep1 ? <Ship size={18} /> : <Truck size={18} />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#06283A]">
                                {isStep1 ? 'Add Barge / LCT Fleet' : 'Add Truck Fleet'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {stage.stage_name} (Stage {stage.stage_order})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errorMessage && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Movement Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {isStep1 ? 'Barge / LCT Name' : 'Truck Identity (Plate No / Hull No)'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={isStep1 ? 'e.g.: Perkasa 01 Barge' : 'e.g.: Hino Truck KT 8899 BB'}
                            value={movementName}
                            onChange={(e) => setMovementName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F6C343]/20 focus:border-[#F6C343] transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Step 3 Parent Tongkang Lineage */}
                    {isStep3 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Source Barge <span className="text-rose-500">*</span>
                            </label>
                            {stage.available_parents && stage.available_parents.length > 0 ? (
                                <select
                                    value={parentMovementId}
                                    onChange={(e) => setParentMovementId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F6C343]/20 focus:border-[#F6C343] transition-all"
                                >
                                    <option value="">-- Select Source Barge --</option>
                                    {stage.available_parents.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.movement_name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                    No Barge fleet registered in Stage 1 yet. Please register a Barge in Stage 1 first.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-[#F6C343] hover:bg-[#E0AD2C] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                        >
                            <Plus size={14} />
                            {isSubmitting ? 'Registering...' : 'Register Fleet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
