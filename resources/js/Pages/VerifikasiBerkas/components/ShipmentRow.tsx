import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ShipmentGroup, SupportedDocumentType } from '../types';

interface ShipmentRowProps {
    shipment: ShipmentGroup;
    onClick: (contractNumber: string) => void;
    isLast: boolean;
    isFirst?: boolean;
}

const REQUIRED_DOCS: { type: SupportedDocumentType; code: string }[] = [
    { type: 'Commercial Invoice', code: 'CI' },
    { type: 'Bill of Lading', code: 'BOL' },
    { type: 'Packing List', code: 'PL' },
    { type: 'Insurance', code: 'INS' },
    { type: 'Certificate of Origin (COO)', code: 'COO' },
];

export default function ShipmentRow({
    shipment,
    onClick,
    isLast,
    isFirst = false,
}: ShipmentRowProps) {
    const isCompleted = shipment.approvedCount === 5;
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
            className={['shipment-row', isFirst ? 'shipment-row--first' : ''].filter(Boolean).join(' ')}
            style={{
                opacity: isCompleted ? 0.45 : 1,
                borderBottom: isLast ? 'none' : '0.5px solid var(--border-subtle, #e2e8f0)',
            }}
        >
            {/* Column 1: Kontrak / Shipper */}
            <div className="shipment-row__col shipment-row__col--contract">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shipment-row__contract-number">
                        {shipment.contractNumber}
                    </span>
                    {shipment.hasWarnings && (
                        <span
                            title="Ketidaksesuaian data terdeteksi antar dokumen"
                            className="shipment-row__warning-icon"
                        >
                            <AlertTriangle size={13} strokeWidth={2.2} />
                        </span>
                    )}
                </div>
                <span className="shipment-row__shipper">
                    {shipment.shipperName}
                </span>
            </div>

            {/* Column 2: Rute */}
            <div className="shipment-row__col shipment-row__col--route">
                <span className="shipment-row__port" title={shipment.portOfLoading}>
                    {polShort}
                </span>
                <ArrowRight size={11} className="shipment-row__arrow" />
                <span className="shipment-row__port" title={shipment.portOfDischarge}>
                    {podShort}
                </span>
            </div>

            {/* Column 3: Dokumen */}
            <div className="shipment-row__col shipment-row__col--docs">
                <div className="shipment-row__doc-statuses">
                    {REQUIRED_DOCS.map((docDef, idx) => {
                        const doc = shipment.documents.find((d) => d.documentType === docDef.type);

                        let color = 'var(--text-muted, #94a3b8)';
                        let fontWeight = 400;
                        let statusLabel = 'Belum diunggah';

                        if (doc) {
                            if (doc.status === 'Approved') {
                                color = 'var(--text-success, #16a34a)';
                                fontWeight = 600;
                                statusLabel = 'Disetujui';
                            } else if (doc.status === 'Rejected') {
                                color = 'var(--text-danger, #dc2626)';
                                fontWeight = 600;
                                statusLabel = 'Ditolak';
                            } else {
                                color = 'var(--text-muted, #94a3b8)';
                                fontWeight = 400;
                                statusLabel = 'Pending';
                            }
                        }

                        return (
                            <span key={docDef.code} className="shipment-row__doc-item">
                                <span
                                    style={{ color, fontWeight }}
                                    title={`${docDef.type}: ${statusLabel}`}
                                >
                                    {docDef.code}
                                </span>
                                {idx < REQUIRED_DOCS.length - 1 && (
                                    <span className="shipment-row__doc-sep">{"\u00B7"}</span>
                                )}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Column 4: Progress */}
            <div className="shipment-row__col shipment-row__col--progress">
                <span
                    className="shipment-row__progress-text"
                    style={{ color: progressColor }}
                >
                    {shipment.approvedCount}/5
                </span>
                <div className="shipment-row__progress-bar">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="shipment-row__progress-segment"
                            style={{
                                backgroundColor:
                                    i < shipment.approvedCount
                                        ? '#16a34a'
                                        : '#e2e8f0',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}