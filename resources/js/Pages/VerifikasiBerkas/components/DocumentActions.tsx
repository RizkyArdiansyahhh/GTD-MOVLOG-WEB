import { CheckCircle, XCircle } from 'lucide-react';
import type { VerificationDocument } from '../types';

interface DocumentActionsProps {
    document: VerificationDocument | null;
    onApprove: (document: VerificationDocument) => void;
    onReject: (document: VerificationDocument) => void;
    isSubmitting?: boolean;
}

export default function DocumentActions({
    document,
    onApprove,
    onReject,
    isSubmitting = false,
}: DocumentActionsProps) {
    if (!document) return null;

    return (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
            {/* Secondary Action: Tolak */}
            <button
                type="button"
                onClick={() => onReject(document)}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#EF4444] text-[#EF4444] hover:bg-rose-50 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
                <XCircle size={18} strokeWidth={2} />
                <span>Tolak</span>
            </button>

            {/* Primary Action: Setujui Berkas */}
            <button
                type="button"
                autoFocus
                onClick={() => onApprove(document)}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                style={{
                    backgroundColor: '#F5B800',
                    color: '#06283A',
                }}
            >
                <CheckCircle size={18} strokeWidth={2.2} />
                <span>Setujui Berkas</span>
            </button>
        </div>
    );
}
