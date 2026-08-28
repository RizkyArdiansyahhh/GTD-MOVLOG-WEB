import { AlertTriangle } from 'lucide-react';
import type { FieldMismatchWarning } from '../types';

interface MismatchWarningsProps {
    warnings: FieldMismatchWarning[];
}

export default function MismatchWarnings({ warnings }: MismatchWarningsProps) {
    if (warnings.length === 0) return null;

    return (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/80">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" strokeWidth={2.2} />
                <h4 className="text-xs font-semibold text-amber-900 leading-tight">
                    Data Mismatch Detected ({warnings.length})
                </h4>
            </div>

            <p className="text-[11px] text-amber-800/90 mb-2 leading-normal">
                Discrepancies found with already verified documents in this shipment:
            </p>

            <div className="flex flex-col gap-1.5">
                {warnings.map((w, index) => (
                    <div
                        key={index}
                        className="text-[11px] leading-relaxed bg-white/80 rounded-lg p-2 border border-amber-200/60"
                    >
                        <div className="font-semibold text-amber-950 flex items-center justify-between">
                            <span>{w.field}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                                vs {w.referenceDocType}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[10px]">
                            <div>
                                <span className="text-slate-400 block">Expected:</span>
                                <span className="text-slate-800 font-medium truncate block" title={w.expected}>
                                    {w.expected}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Actual:</span>
                                <span className="text-rose-700 font-medium truncate block" title={w.actual}>
                                    {w.actual}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
