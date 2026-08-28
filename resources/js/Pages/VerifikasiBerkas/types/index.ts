export type SupportedDocumentType =
    | 'Bill of Lading'
    | 'Commercial Invoice'
    | 'Packing List'
    | 'Certificate of Origin (COO)'
    | 'Insurance';

export const REQUIRED_DOCUMENT_TYPES: SupportedDocumentType[] = [
    'Bill of Lading',
    'Commercial Invoice',
    'Packing List',
    'Certificate of Origin (COO)',
    'Insurance',
];

export const TOTAL_REQUIRED_DOCUMENTS = REQUIRED_DOCUMENT_TYPES.length; // 5

export type VerificationStatus =
    | 'Pending'
    | 'Approved'
    | 'Verified'
    | 'Rejected'
    | 'Draft'
    | 'WaitingForResubmission';

export enum VerificationStatusEnum {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    VERIFIED = 'Verified',
    REJECTED = 'Rejected',
    DRAFT = 'Draft',
    WAITING_FOR_RESUBMISSION = 'WaitingForResubmission',
}

export interface CompanyEntity {
    name: string;
    address: string;
    taxId: string;
}

export interface TransportDetail {
    portOfLoading: string;
    portOfDischarge: string;
    shippName?: string;
    shipName?: string;
    voyage?: string;
}

export interface CargoItem {
    id?: string;
    description?: string;
    descriptionOfGoods?: string;
    quantityGoods?: number | string;
    quantityOfGoods?: string;
    goodsUnit?: string;
    goodsUnitMeasurement?: string;
    quantityPackage?: number | string;
    quantityOfPackage?: string;
    packageUnit?: string;
    packageUnitMeasurement?: string;
    currency?: string;
    price?: number | string;
    priceOfGoods?: string;
    type?: string;
    brand?: string;
    hsCodePOL?: string;
    hsCodePol?: string;
    hsCodePOD?: string;
    hsCodePod?: string;
    netWeight?: string;
    grossWeight?: string;
    volume?: string;
    volumeDimension?: string;
    packages?: string;
}

export interface VerificationDocument {
    id: string;
    assignmentNoRef?: string;
    documentNumber: string;
    documentType: SupportedDocumentType;
    title: string;
    uploadedBy: string;
    customerName?: string;
    uploadDate: string;
    timeAgo: string;
    shipmentReference: string;
    status: VerificationStatus;
    rawStatus?: string;
    notes?: string | null;
    rejectionReason?: string | null;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
    fileUrl?: string | null;
    previewUrl?: string | null;
    fileName?: string | null;
    thumbnail?: string;

    // Detailed fields from custom clearance document structure
    contractNumber?: string;
    termOfShipment?: 'FOB' | 'CIF';
    oceanFreight?: string;
    insuranceFee?: string;
    shipper?: CompanyEntity | null;
    consignee?: CompanyEntity | null;
    notifyParty?: CompanyEntity | null;
    transportDetail?: TransportDetail | null;
    cargoDetails?: CargoItem[] | null;
    totals?: any;
    relatedDocumentNumbers?: Record<string, any> | null;
    amountInsured?: string | null;
    documentData?: Record<string, any> | null;
}

export interface DocumentStats {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
}

export interface ShipmentGroup {
    contractNumber: string;
    customerName: string;
    shipperName: string;
    consigneeName: string;
    portOfLoading: string;
    portOfDischarge: string;
    documents: VerificationDocument[];
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    totalDocuments: number;
    oldestPendingDate: string | null;
    hasWarnings: boolean;
}

export interface FieldMismatchWarning {
    field: string;
    documentType: string;
    expected: string;
    actual: string;
    referenceDocType: string;
}

