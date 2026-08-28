import { UserCheck, Clock } from 'lucide-react';
import type { VerificationDocument } from '../types';

interface DocumentMetadataProps {
    document: VerificationDocument | null;
}

export default function DocumentMetadata({ document }: DocumentMetadataProps) {
    if (!document) return null;

    const isApproved = document.status === 'Approved' || document.status === 'Verified';
    const isRejected = document.status === 'Rejected';
    const isFinalState = isApproved || isRejected;

    const getStatusStyle = (status: VerificationDocument['status']) => {
        if (status === 'Approved' || status === 'Verified') {
            return 'text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1.5';
        }
        if (status === 'Rejected') {
            return 'text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1.5';
        }
        return 'text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1.5';
    };

    const displayStatus = (status: VerificationDocument['status']) => {
        if (status === 'Approved' || status === 'Verified') return 'Verified';
        if (status === 'Rejected') return 'Rejected';
        return 'Pending';
    };

    return (
        <div className="flex flex-col gap-3">
            {/* General Document Metadata */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-2 flex items-center justify-between">
                    <span>Document Metadata</span>
                    <span className="text-[10px] text-gray-400 font-mono font-normal">
                        ID: {document.id}
                    </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[12px] font-medium" style={{ color: '#64748B' }}>
                    <div>
                        <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Uploaded By</span>
                        <span className="text-gray-900 font-semibold">{document.uploadedBy}</span>
                    </div>

                    <div>
                        <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Upload Date</span>
                        <span className="text-gray-900 font-semibold">{document.uploadDate}</span>
                    </div>

                    <div>
                        <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Document Type</span>
                        <span className="text-gray-900 font-semibold">{document.documentType}</span>
                    </div>

                    <div>
                        <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Shipment Reference</span>
                        <span className="text-amber-700 font-mono font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block">
                            {document.shipmentReference || document.assignmentNoRef}
                        </span>
                    </div>
                </div>
            </div>

            {/* Audit Information Section */}
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-slate-600" />
                    <span>Verification Audit Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                    <div>
                        <span className="block text-slate-400 text-[11px] font-normal mb-0.5">Verification Status</span>
                        <span className={getStatusStyle(document.status)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {displayStatus(document.status)}
                        </span>
                    </div>

                    <div>
                        <span className="block text-slate-400 text-[11px] font-normal mb-0.5">Supervisor Verifier</span>
                        <span className="text-slate-900 font-semibold flex items-center gap-1">
                            <UserCheck size={13} className="text-slate-400" />
                            {document.verifiedBy || (isFinalState ? 'Logistics Supervisor' : 'Not Yet Verified')}
                        </span>
                    </div>

                    <div>
                        <span className="block text-slate-400 text-[11px] font-normal mb-0.5">Verification Date</span>
                        <span className="text-slate-900 font-medium flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            {document.verifiedAt || (isFinalState ? document.uploadDate : 'Pending Verification')}
                        </span>
                    </div>

                    <div>
                        <span className="block text-slate-400 text-[11px] font-normal mb-0.5">
                            {isRejected ? 'Rejection Reason' : 'Verification Notes'}
                        </span>
                        <span className={[
                            'block text-[12px]',
                            isRejected
                                ? 'text-rose-700 font-medium bg-rose-50/80 p-2 rounded border border-rose-100'
                                : 'text-slate-700 italic font-normal'
                        ].join(' ')}>
                            {document.rejectionReason || document.notes || 'No notes provided.'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
