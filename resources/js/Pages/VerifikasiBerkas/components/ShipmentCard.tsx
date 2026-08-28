import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ShipmentGroup, SupportedDocumentType } from '../types';

interface ShipmentCardProps {
    shipment: ShipmentGroup;
    onClick: (contractNumber: string) => void;
}

const REQUIRED_DOCS: { type: SupportedDocumentType; code: string }[] = [
    { type: 'Commercial Invoice', code: 'CI' },
    { type: 'Bill of Lading', code: 'BOL' },
    { type: 'Packing List', code: 'PL' },
    { type: 'Insurance', code: 'INS' },
    { type: 'Certificate of Origin (COO)', code: 'COO' },
];

export default function ShipmentCard({ shipment, onClick }: ShipmentCardProps) {
    const totalDocs = shipment.totalDocuments || 5;
    const isCompleted = shipment.approvedCount === totalDocs && totalDocs > 0;
    const hasRejected = shipment.rejectedCount > 0;
    const hasPending = shipment.pendingCount > 0;

    const polShort = shipment.portOfLoading.split(',')[0] || shipment.portOfLoading;
    const podShort = shipment.portOfDischarge.split(',')[0] || shipment.portOfDischarge;

    let progressColor = 'var(--text-muted, #94a3b8)';
    if (hasRejected) {
        progressColor = 'var(--text-danger, #dc2626)';
    } else if (hasPending) {
        progressColor = 'var(--text-warning, #d97706)';
    } else if (isCompleted) {
        progressColor = 'var(--text-primary, #06283A)';
    }

    let statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending</span>
        </span>
    );

    if (hasRejected) {
        statusBadge = (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Rejected</span>
            </span>
        );
    } else if (isCompleted) {
        statusBadge = (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Verified</span>
            </span>
        );
    }

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
            className="shipment-card w-full"
            style={{
                opacity: isCompleted ? 0.45 : 1,
            }}
        >
            {/* Header: Customer & Progress + Status Badge */}
            <div className="shipment-card__header">
                <div className="shipment-card__contract-wrap">
                    <div className="shipment-card__contract-row">
                        <span className="shipment-card__contract-number" title={shipment.customerName}>
                            {shipment.customerName}
                        </span>
                        {shipment.hasWarnings && (
                            <span
                                title="Data mismatch detected across shipment documents"
                                className="shipment-card__warning-icon"
                            >
                                <AlertTriangle size={13} strokeWidth={2.2} />
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {statusBadge}
                    <div className="shipment-card__progress-wrap">
                        <span
                            className="shipment-card__progress-num"
                            style={{ color: progressColor }}
                        >
                            {shipment.approvedCount}
                        </span>
                        <span className="shipment-card__progress-total">/{totalDocs}</span>
                    </div>
                </div>
            </div>

            {/* Route */}
            <div className="shipment-card__route">
                <span className="shipment-card__port" title={shipment.portOfLoading}>
                    {polShort}
                </span>
                <ArrowRight size={11} className="shipment-card__route-arrow" />
                <span className="shipment-card__port" title={shipment.portOfDischarge}>
                    {podShort}
                </span>
            </div>

            {/* Document Status Codes */}
            <div className="shipment-card__docs-row">
                {REQUIRED_DOCS.map((docDef) => {
                    const doc = shipment.documents.find((d) => d.documentType === docDef.type);

                    let color = 'var(--text-muted, #94a3b8)';
                    let fontWeight = 400;
                    let statusLabel = 'Not uploaded';

                    if (doc) {
                        if (doc.status === 'Approved' || doc.status === 'Verified') {
                            color = 'var(--text-success, #16a34a)';
                            fontWeight = 600;
                            statusLabel = 'Verified';
                        } else if (doc.status === 'Rejected') {
                            color = 'var(--text-danger, #dc2626)';
                            fontWeight = 600;
                            statusLabel = 'Rejected';
                        } else {
                            color = 'var(--text-muted, #94a3b8)';
                            fontWeight = 400;
                            statusLabel = 'Pending verification';
                        }
                    }

                    return (
                        <span
                            key={docDef.code}
                            className="shipment-card__doc-tag"
                            style={{
                                color,
                                fontWeight,
                            }}
                            title={`${docDef.type}: ${statusLabel}`}
                        >
                            {docDef.code}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
