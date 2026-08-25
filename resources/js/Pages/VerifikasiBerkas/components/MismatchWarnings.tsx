import { AlertTriangle } from 'lucide-react';
import type { FieldMismatchWarning } from '../types';

interface MismatchWarningsProps {
    warnings: FieldMismatchWarning[];
}

export default function MismatchWarnings({ warnings }: MismatchWarningsProps) {
    if (warnings.length === 0) return null;

    return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 mt-3">
            <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} className="text-amber-600" strokeWidth={2.2} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-amber-900">
                        Ketidaksesuaian Data Terdeteksi
                    </h4>
                    <p className="text-[10px] text-amber-700 font-normal">
                        Ditemukan {warnings.length} perbedaan dengan dokumen yang sudah di-approve dalam shipment ini. Verifikasi bersifat non-blocking.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                {warnings.map((w, i) => (
                    <div
                        key={`${w.field}-${i}`}
                        className="bg-white/70 rounded-lg border border-amber-200/60 px-3 py-2 text-[11px] leading-relaxed"
                    >
                        <span className="font-semibold text-amber-900">{w.field}</span>
                        <span className="text-amber-700">
                            {' '}berbeda dengan{' '}
                            <span className="font-semibold">{w.referenceDocType}</span>
                            {' '}yang sudah di-approve:
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] border border-rose-200/60 max-w-[180px] truncate" title={w.actual}>
                                {w.actual}
                            </span>
                            <span className="text-amber-500 text-[10px]">vs</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200/60 max-w-[180px] truncate" title={w.expected}>
                                {w.expected}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
