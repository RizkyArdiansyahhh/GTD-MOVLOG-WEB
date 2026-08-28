import { CheckCircle, XCircle, Info, ShieldCheck } from 'lucide-react';
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

    const isApproved = document.status === 'Approved' || document.status === 'Verified';
    const isRejected = document.status === 'Rejected';
    const isFinalStatus = isApproved || isRejected;

    // Hide action buttons if status is already Verified or Rejected
    if (isFinalStatus) {
        return (
            <div className="pt-3 border-t border-gray-100 shrink-0">
                {isApproved && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                        <div>
                            <span className="font-semibold block text-emerald-900">Final Status: Verified</span>
                            <span>This document has been verified and marked as final.</span>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block text-amber-900 mb-0.5">Final Status: Rejected (Pending Revision)</span>
                            <span>
                                This document was rejected. Re-upload will be handled through the document submission workflow.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
            {/* Secondary Action: Reject */}
            <button
                type="button"
                onClick={() => onReject(document)}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#EF4444] text-[#EF4444] hover:bg-rose-50 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
                <XCircle size={18} strokeWidth={2} />
                <span>Reject</span>
            </button>

            {/* Primary Action: Verify Document */}
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
                <span>Verify Document</span>
            </button>
        </div>
    );
}
