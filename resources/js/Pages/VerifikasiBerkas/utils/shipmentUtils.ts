import {
    type VerificationDocument,
    type ShipmentGroup,
    type FieldMismatchWarning,
    REQUIRED_DOCUMENT_TYPES,
    TOTAL_REQUIRED_DOCUMENTS,
} from '../types';

/**
 * Determine the priority rank for sorting:
 * 1. Minimal 1 dokumen ditolak (Paling urgent, butuh revisi dari pihak pengirim).
 * 2. Dokumen pending verifikasi (Sudah diupload, menunggu ditinjau supervisor).
 * 3. Dokumen belum diupload sama sekali / belum lengkap (Perlu follow-up ke pihak luar).
 * 4. 5/5 approved / selesai (Selalu di paling bawah).
 */
function getShipmentPriorityRank(group: ShipmentGroup): number {
    if (group.rejectedCount > 0) return 1;
    if (group.pendingCount > 0) return 2;
    if (group.approvedCount < TOTAL_REQUIRED_DOCUMENTS) return 3;
    return 4;
}

/**
 * Group a flat list of documents by their contractNumber into ShipmentGroup[].
 * Each shipment contains all 5 required document types:
 * Commercial Invoice, Bill of Lading, Packing List, Insurance, Certificate of Origin (COO).
 *
 * Sorting Priority (Urgency):
 * 1. Shipments with rejected documents (needs revision from sender - highest urgency).
 * 2. Shipments with pending verification documents (waiting for supervisor review), sorted by oldest pending date.
 * 3. Shipments with documents not uploaded yet / missing docs (needs follow-up to external parties).
 * 4. Shipments with 5/5 approved documents (completed) -> always at the bottom.
 */
export function groupDocumentsByShipment(
    documents: VerificationDocument[]
): ShipmentGroup[] {
    const map = new Map<string, VerificationDocument[]>();

    for (const doc of documents) {
        const key = doc.contractNumber || 'UNKNOWN';
        const group = map.get(key);
        if (group) {
            group.push(doc);
        } else {
            map.set(key, [doc]);
        }
    }

    const groups: ShipmentGroup[] = [];

    for (const [contractNumber, uploadedDocs] of map) {
        // Extract common fields from the first doc that has them
        const firstWithShipper = uploadedDocs.find((d) => d.shipper);
        const firstWithConsignee = uploadedDocs.find((d) => d.consignee);
        const firstWithTransport = uploadedDocs.find((d) => d.transportDetail);

        // Sort documents in standard order: Commercial Invoice, Bill of Lading, Packing List, Insurance, Certificate of Origin
        const orderedDocs = [...uploadedDocs].sort((a, b) => {
            const indexA = REQUIRED_DOCUMENT_TYPES.indexOf(a.documentType);
            const indexB = REQUIRED_DOCUMENT_TYPES.indexOf(b.documentType);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

        const approvedCount = orderedDocs.filter((d) => d.status === 'Approved').length;
        const pendingCount = orderedDocs.filter((d) => d.status === 'Pending').length;
        const rejectedCount = orderedDocs.filter((d) => d.status === 'Rejected').length;

        // Oldest pending date for sorting
        const pendingDocs = orderedDocs.filter((d) => d.status === 'Pending' && d.uploadDate);
        const oldestPendingDate =
            pendingDocs.length > 0
                ? pendingDocs.reduce((oldest, d) =>
                      d.uploadDate < oldest.uploadDate ? d : oldest
                  ).uploadDate
                : null;

        // Check for any mismatches among approved docs
        const approvedDocs = orderedDocs.filter((d) => d.status === 'Approved');
        let hasWarnings = false;
        for (const doc of orderedDocs) {
            if (doc.status !== 'Approved' && approvedDocs.length > 0) {
                const warnings = detectFieldMismatches(doc, approvedDocs);
                if (warnings.length > 0) {
                    hasWarnings = true;
                    break;
                }
            }
        }

        groups.push({
            contractNumber,
            customerName: uploadedDocs[0]?.uploadedBy || '-',
            shipperName: firstWithShipper?.shipper?.name || '-',
            consigneeName: firstWithConsignee?.consignee?.name || '-',
            portOfLoading: firstWithTransport?.transportDetail?.portOfLoading || '-',
            portOfDischarge: firstWithTransport?.transportDetail?.portOfDischarge || '-',
            documents: orderedDocs,
            approvedCount,
            pendingCount,
            rejectedCount,
            totalDocuments: TOTAL_REQUIRED_DOCUMENTS, // Always 5
            oldestPendingDate,
            hasWarnings,
        });
    }

    // Sort according to priority (urgency):
    // 1. Minimal 1 dokumen ditolak (Paling urgent)
    // 2. Pending verifikasi (Diurutkan dari yang paling lama menunggu)
    // 3. Dokumen belum diupload / belum lengkap
    // 4. Selesai (5/5 approved)
    groups.sort((a, b) => {
        const rankA = getShipmentPriorityRank(a);
        const rankB = getShipmentPriorityRank(b);

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        // Rank 1: Rejected docs -> sort by oldest pending date if present, then contractNumber
        if (rankA === 1) {
            if (a.oldestPendingDate && b.oldestPendingDate) {
                return a.oldestPendingDate.localeCompare(b.oldestPendingDate);
            }
            if (a.oldestPendingDate) return -1;
            if (b.oldestPendingDate) return 1;
            return a.contractNumber.localeCompare(b.contractNumber);
        }

        // Rank 2: Pending verification -> oldest pending date first (longest waiting)
        if (rankA === 2) {
            if (a.oldestPendingDate && b.oldestPendingDate) {
                return a.oldestPendingDate.localeCompare(b.oldestPendingDate);
            }
            if (a.oldestPendingDate) return -1;
            if (b.oldestPendingDate) return 1;
            return a.contractNumber.localeCompare(b.contractNumber);
        }

        // Rank 3 (Unuploaded) and Rank 4 (Completed): sort alphabetically by contractNumber
        return a.contractNumber.localeCompare(b.contractNumber);
    });

    return groups;
}

/**
 * Detect field mismatches between a document and already-approved documents
 * in the same shipment. Returns an array of warnings.
 *
 * Fields compared:
 * - Shipper (name, address, taxId)
 * - Consignee (name, address, taxId)
 * - Transport Detail (portOfLoading, portOfDischarge, shipName, voyage)
 */
export function detectFieldMismatches(
    document: VerificationDocument,
    approvedDocs: VerificationDocument[]
): FieldMismatchWarning[] {
    const warnings: FieldMismatchWarning[] = [];

    for (const approved of approvedDocs) {
        // ── Shipper comparison ──
        if (document.shipper && approved.shipper) {
            if (document.shipper.name && approved.shipper.name &&
                document.shipper.name !== approved.shipper.name) {
                warnings.push({
                    field: 'Shipper Name',
                    documentType: document.documentType,
                    expected: approved.shipper.name,
                    actual: document.shipper.name,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.shipper.address && approved.shipper.address &&
                document.shipper.address !== approved.shipper.address) {
                warnings.push({
                    field: 'Shipper Address',
                    documentType: document.documentType,
                    expected: approved.shipper.address,
                    actual: document.shipper.address,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.shipper.taxId && approved.shipper.taxId &&
                document.shipper.taxId !== approved.shipper.taxId) {
                warnings.push({
                    field: 'Shipper Tax ID',
                    documentType: document.documentType,
                    expected: approved.shipper.taxId,
                    actual: document.shipper.taxId,
                    referenceDocType: approved.documentType,
                });
            }
        }

        // ── Consignee comparison ──
        if (document.consignee && approved.consignee) {
            if (document.consignee.name && approved.consignee.name &&
                document.consignee.name !== approved.consignee.name) {
                warnings.push({
                    field: 'Consignee Name',
                    documentType: document.documentType,
                    expected: approved.consignee.name,
                    actual: document.consignee.name,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.consignee.address && approved.consignee.address &&
                document.consignee.address !== approved.consignee.address) {
                warnings.push({
                    field: 'Consignee Address',
                    documentType: document.documentType,
                    expected: approved.consignee.address,
                    actual: document.consignee.address,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.consignee.taxId && approved.consignee.taxId &&
                document.consignee.taxId !== approved.consignee.taxId) {
                warnings.push({
                    field: 'Consignee Tax ID',
                    documentType: document.documentType,
                    expected: approved.consignee.taxId,
                    actual: document.consignee.taxId,
                    referenceDocType: approved.documentType,
                });
            }
        }

        // ── Transport Detail comparison ──
        if (document.transportDetail && approved.transportDetail) {
            if (document.transportDetail.portOfLoading && approved.transportDetail.portOfLoading &&
                document.transportDetail.portOfLoading !== approved.transportDetail.portOfLoading) {
                warnings.push({
                    field: 'Port of Loading',
                    documentType: document.documentType,
                    expected: approved.transportDetail.portOfLoading,
                    actual: document.transportDetail.portOfLoading,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.transportDetail.portOfDischarge && approved.transportDetail.portOfDischarge &&
                document.transportDetail.portOfDischarge !== approved.transportDetail.portOfDischarge) {
                warnings.push({
                    field: 'Port of Discharge',
                    documentType: document.documentType,
                    expected: approved.transportDetail.portOfDischarge,
                    actual: document.transportDetail.portOfDischarge,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.transportDetail.shipName && approved.transportDetail.shipName &&
                document.transportDetail.shipName !== approved.transportDetail.shipName) {
                warnings.push({
                    field: 'Ship Name',
                    documentType: document.documentType,
                    expected: approved.transportDetail.shipName,
                    actual: document.transportDetail.shipName,
                    referenceDocType: approved.documentType,
                });
            }
            if (document.transportDetail.voyage && approved.transportDetail.voyage &&
                document.transportDetail.voyage !== approved.transportDetail.voyage) {
                warnings.push({
                    field: 'Voyage',
                    documentType: document.documentType,
                    expected: approved.transportDetail.voyage,
                    actual: document.transportDetail.voyage,
                    referenceDocType: approved.documentType,
                });
            }
        }
    }

    // Deduplicate warnings by field + actual + expected
    const unique = new Map<string, FieldMismatchWarning>();
    for (const w of warnings) {
        const key = `${w.field}|${w.actual}|${w.expected}`;
        if (!unique.has(key)) {
            unique.set(key, w);
        }
    }

    return Array.from(unique.values());
}
