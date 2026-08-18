import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ShipmentGroup, SupportedDocumentType } from '../types';

interface ShipmentRowProps {
    shipment: ShipmentGroup;
    onClick: (contractNumber: string) => void;
    isLast: boolean;
    isFirst?: boolean;
}

/** Short label for document type */
const docTypeShort: Record<SupportedDocumentType, string> = {
    'Commercial Invoice': 'CI',
    'Bill of Lading': 'BOL',
    'Packing List': 'PL',
    'Insurance': 'INS',
    'Certificate of Origin (COO)': 'COO',
};

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
            className={['shipment-row', isFirst ? 'shipment-row--first' : ''].filter(Boolean).join(' ')}
            style={{
                opacity: isCompleted ? 0.52 : 1,
                borderBottom: isLast ? 'none' : '0.5px solid #e2e8f0',
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
                            title="Ketidaksesuaian data terdeteksi"
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
                {noDocsUploaded ? (
                    <span className="shipment-row__no-docs">
                        Belum ada dokumen diupload
                    </span>
                ) : (
                    <div className="shipment-row__doc-statuses">
                        {shipment.documents.map((doc, idx) => {
                            const short = docTypeShort[doc.documentType] || doc.documentType;

                            let color = '#94a3b8'; // Pending atau belum upload
                            if (doc.status === 'Approved') {
                                color = '#06283A'; // Approved
                            } else if (doc.status === 'Rejected') {
                                color = '#e11d48'; // Ditolak
                            }

                            return (
                                <span key={doc.id} className="shipment-row__doc-item">
                                    <span
                                        style={{ color, fontWeight: 400 }}
                                        title={
                                            doc.documentType +
                                            ': ' +
                                            (doc.status === 'Rejected'
                                                ? 'Ditolak'
                                                : doc.status === 'Approved'
                                                ? 'Disetujui'
                                                : 'Pending')
                                        }
                                    >
                                        {short}
                                    </span>
                                    {idx < shipment.documents.length - 1 && (
                                        <span className="shipment-row__doc-sep">{"\u00B7"}</span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}
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
                                        ? '#22c55e'
                                        : '#e2e8f0',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
