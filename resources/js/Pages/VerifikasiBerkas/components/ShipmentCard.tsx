import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ShipmentGroup, SupportedDocumentType } from '../types';

interface ShipmentCardProps {
    shipment: ShipmentGroup;
    onClick: (contractNumber: string) => void;
}

const docTypeShort: Record<SupportedDocumentType, string> = {
    'Commercial Invoice': 'CI',
    'Bill of Lading': 'BOL',
    'Packing List': 'PL',
    'Insurance': 'INS',
    'Certificate of Origin (COO)': 'COO',
};

export default function ShipmentCard({ shipment, onClick }: ShipmentCardProps) {
    const isCompleted = shipment.approvedCount === 5;
    const hasRejected = shipment.rejectedCount > 0;
    const hasPending = shipment.pendingCount > 0;

    let progressColor = '#94a3b8';
    if (hasRejected) {
        progressColor = '#e11d48';
    } else if (hasPending) {
        progressColor = '#d97706';
    }

    const noDocsUploaded = shipment.documents.length === 0;

    return (
        <div
            onClick={() => onClick(shipment.contractNumber)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(shipment.contractNumber);
                }
            }}
            className={[
                'group relative bg-white rounded-[10px] border border-[#E2E8F0] shadow-[0_1px_4px_rgba(6,40,58,0.04)] p-4 cursor-pointer select-none outline-none transition-all duration-150 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(6,40,58,0.06)] focus-visible:ring-2 focus-visible:ring-slate-400',
                isCompleted ? 'opacity-55' : '',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-sm text-[#06283A] truncate">
                            {shipment.contractNumber}
                        </span>
                        {shipment.hasWarnings && (
                            <span
                                title="Ketidaksesuaian data terdeteksi"
                                className="inline-flex items-center text-amber-500 shrink-0"
                            >
                                <AlertTriangle size={13} strokeWidth={2.2} />
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                        {shipment.shipperName}
                    </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: progressColor }}
                    >
                        {shipment.approvedCount}/5
                    </span>
                    <div className="flex gap-0.5 mt-1.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-2.5 h-1 rounded-[1px]"
                                style={{
                                    backgroundColor:
                                        i < shipment.approvedCount
                                            ? '#22c55e'
                                            : '#e2e8f0',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3 font-normal">
                <span className="truncate max-w-[140px]" title={shipment.portOfLoading}>
                    {shipment.portOfLoading.split(',')[0]}
                </span>
                <ArrowRight size={11} className="text-slate-300 shrink-0" />
                <span className="truncate max-w-[140px]" title={shipment.portOfDischarge}>
                    {shipment.portOfDischarge.split(',')[0]}
                </span>
            </div>

            <div className="pt-2.5 border-t border-slate-100">
                {noDocsUploaded ? (
                    <span className="text-xs text-slate-400 italic">
                        Belum ada dokumen diupload
                    </span>
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {shipment.documents.map((doc, idx) => {
                            const short = docTypeShort[doc.documentType] || doc.documentType;

                            let color = '#94a3b8';
                            if (doc.status === 'Approved') {
                                color = '#06283A';
                            } else if (doc.status === 'Rejected') {
                                color = '#e11d48';
                            }

                            return (
                                <span key={doc.id} className="inline-flex items-center gap-1.5">
                                    <span
                                        className="text-xs font-normal"
                                        style={{ color }}
                                        title={doc.documentType + ': ' + doc.status}
                                    >
                                        {short}
                                    </span>
                                    {idx < shipment.documents.length - 1 && (
                                        <span className="text-slate-300 text-xs select-none">{"\u00B7"}</span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
