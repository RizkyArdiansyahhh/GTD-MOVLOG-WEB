import {
    type VerificationDocument,
    type ShipmentGroup,
    type FieldMismatchWarning,
    REQUIRED_DOCUMENT_TYPES,
    TOTAL_REQUIRED_DOCUMENTS,
} from '../types';

/**
 * Determine the priority rank for sorting:
 * 1. Has rejected documents (highest priority, needs revision).
 * 2. Has pending documents (waiting for supervisor review).
 * 3. Incomplete documents.
 * 4. Completed (all verified/approved).
 */
function getShipmentPriorityRank(group: ShipmentGroup): number {
    if (group.rejectedCount > 0) return 1;
    if (group.pendingCount > 0) return 2;
    if (group.approvedCount < TOTAL_REQUIRED_DOCUMENTS) return 3;
    return 4;
}

/**
 * Group a flat list of documents by their assignment reference / contract number into ShipmentGroup[].
 */
export function groupDocumentsByShipment(
    documents: VerificationDocument[]
): ShipmentGroup[] {
    const map = new Map<string, VerificationDocument[]>();

    for (const doc of documents) {
        const key = doc.assignmentNoRef || doc.contractNumber || doc.shipmentReference || 'UNKNOWN';
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
        const firstWithShipper = uploadedDocs.find((d) => d.shipper?.name);
        const firstWithConsignee = uploadedDocs.find((d) => d.consignee?.name);
        const firstWithTransport = uploadedDocs.find((d) => d.transportDetail?.portOfLoading);

        // Sort documents in standard order: Commercial Invoice, Bill of Lading, Packing List, Insurance, Certificate of Origin
        const orderedDocs = [...uploadedDocs].sort((a, b) => {
            const indexA = REQUIRED_DOCUMENT_TYPES.indexOf(a.documentType);
            const indexB = REQUIRED_DOCUMENT_TYPES.indexOf(b.documentType);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

        const isDocApproved = (d: VerificationDocument) => d.status === 'Approved' || d.status === 'Verified';
        const isDocRejected = (d: VerificationDocument) => d.status === 'Rejected';
        const isDocPending = (d: VerificationDocument) => d.status === 'Pending';

        const approvedCount = orderedDocs.filter(isDocApproved).length;
        const pendingCount = orderedDocs.filter(isDocPending).length;
        const rejectedCount = orderedDocs.filter(isDocRejected).length;

        // Oldest pending date for sorting
        const pendingDocs = orderedDocs.filter((d) => isDocPending(d) && d.uploadDate);
        const oldestPendingDate =
            pendingDocs.length > 0
                ? pendingDocs.reduce((oldest, d) =>
                      d.uploadDate < oldest.uploadDate ? d : oldest
                  ).uploadDate
                : null;

        // Check for any mismatches among approved docs
        const approvedDocs = orderedDocs.filter(isDocApproved);
        let hasWarnings = false;
        for (const doc of orderedDocs) {
            if (!isDocApproved(doc) && approvedDocs.length > 0) {
                const warnings = detectFieldMismatches(doc, approvedDocs);
                if (warnings.length > 0) {
                    hasWarnings = true;
                    break;
                }
            }
        }

        const customerName = uploadedDocs[0]?.customerName
            || uploadedDocs[0]?.uploadedBy
            || '-';

        groups.push({
            contractNumber,
            customerName,
            shipperName: firstWithShipper?.shipper?.name || '-',
            consigneeName: firstWithConsignee?.consignee?.name || '-',
            portOfLoading: firstWithTransport?.transportDetail?.portOfLoading || '-',
            portOfDischarge: firstWithTransport?.transportDetail?.portOfDischarge || '-',
            documents: orderedDocs,
            approvedCount,
            pendingCount,
            rejectedCount,
            totalDocuments: orderedDocs.length || TOTAL_REQUIRED_DOCUMENTS,
            oldestPendingDate,
            hasWarnings,
        });
    }

    // Sort according to priority (urgency):
    // 1. Rejected documents (highest priority)
    // 2. Pending verification (sorted by oldest pending date)
    // 3. Incomplete / unuploaded documents
    // 4. Completed (all approved/verified)
    groups.sort((a, b) => {
        const rankA = getShipmentPriorityRank(a);
        const rankB = getShipmentPriorityRank(b);

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        if (rankA === 1 || rankA === 2) {
            if (a.oldestPendingDate && b.oldestPendingDate) {
                return a.oldestPendingDate.localeCompare(b.oldestPendingDate);
            }
            if (a.oldestPendingDate) return -1;
            if (b.oldestPendingDate) return 1;
            return a.contractNumber.localeCompare(b.contractNumber);
        }

        return a.contractNumber.localeCompare(b.contractNumber);
    });

    return groups;
}

/**
 * Detect field mismatches between a document and already-approved documents
 * in the same shipment. Returns an array of warnings.
 */
export function detectFieldMismatches(
    document: VerificationDocument,
    approvedDocs: VerificationDocument[]
): FieldMismatchWarning[] {
    const warnings: FieldMismatchWarning[] = [];

    for (const approved of approvedDocs) {
        // Shipper comparison
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

        // Consignee comparison
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

        // Transport Detail comparison
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
            const shipNameA = document.transportDetail.shipName || document.transportDetail.shippName;
            const shipNameB = approved.transportDetail.shipName || approved.transportDetail.shippName;
            if (shipNameA && shipNameB && shipNameA !== shipNameB) {
                warnings.push({
                    field: 'Ship Name',
                    documentType: document.documentType,
                    expected: shipNameB,
                    actual: shipNameA,
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

    // Deduplicate warnings
    const unique = new Map<string, FieldMismatchWarning>();
    for (const w of warnings) {
        const key = `${w.field}|${w.actual}|${w.expected}`;
        if (!unique.has(key)) {
            unique.set(key, w);
        }
    }

    return Array.from(unique.values());
}
