export type SupportedDocumentType =
    | 'Insurance'
    | 'Certificate of Origin (COO)'
    | 'Packing List'
    | 'Commercial Invoice'
    | 'Bill of Lading';

export type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface VerificationDocument {
    id: string;
    documentNumber: string;
    documentType: SupportedDocumentType;
    title: string;
    uploadedBy: string;
    uploadDate: string;
    timeAgo: string;
    shipmentReference: string;
    status: VerificationStatus;
    notes?: string;
    previewUrl?: string;
    thumbnail?: string;
}

export interface DocumentStats {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
}
