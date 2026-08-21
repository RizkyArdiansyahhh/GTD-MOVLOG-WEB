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
    const isCompleted = shipment.approvedCount === 5;
    const hasRejected = shipment.rejectedCount > 0;
    const hasPending = shipment.pendingCount > 0;

    const polShort = shipment.portOfLoading.split(',')[0] || shipment.portOfLoading;
    const podShort = shipment.portOfDischarge.split(',')[0] || shipment.portOfDischarge;

    // Progress color follows urgency:
    // Red if rejected, warning/yellow if pending, normal dark text if completed (5/5), muted otherwise
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
            className="shipment-card w-full"
            style={{
                opacity: isCompleted ? 0.45 : 1,
            }}
        >
            {/* Header: Kontrak / Shipper (Kiri) & Progress X/5 (Kanan) */}
            <div className="shipment-card__header">
                <div className="shipment-card__contract-wrap">
                    <div className="shipment-card__contract-row">
                        <span className="shipment-card__contract-number" title={shipment.contractNumber}>
                            {shipment.contractNumber}
                        </span>
                        {shipment.hasWarnings && (
                            <span
                                title="Ketidaksesuaian data terdeteksi antar dokumen"
                                className="shipment-card__warning-icon"
                            >
                                <AlertTriangle size={13} strokeWidth={2.2} />
                            </span>
                        )}
                    </div>
                    <p className="shipment-card__shipper" title={shipment.shipperName}>
                        {shipment.shipperName}
                    </p>
                </div>

                <div className="shipment-card__progress-wrap">
                    <span
                        className="shipment-card__progress-num"
                        style={{ color: progressColor }}
                    >
                        {shipment.approvedCount}
                    </span>
                    <span className="shipment-card__progress-total">/5</span>
                </div>
            </div>

            {/* Baris Rute: Port Asal → Port Tujuan */}
            <div className="shipment-card__route">
                <span className="shipment-card__port" title={shipment.portOfLoading}>
                    {polShort}
                </span>
                <ArrowRight size={11} className="shipment-card__route-arrow" />
                <span className="shipment-card__port" title={shipment.portOfDischarge}>
                    {podShort}
                </span>
            </div>

            {/* Baris Status Dokumen (Horizontal flow dengan gap, rata kiri tanpa kotak-kotak) */}
            <div className="shipment-card__docs-row">
                {REQUIRED_DOCS.map((docDef) => {
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
                            statusLabel = 'Pending verifikasi';
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