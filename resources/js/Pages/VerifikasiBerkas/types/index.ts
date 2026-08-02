export type SupportedDocumentType =
    | 'Insurance'
    | 'Certificate of Origin (COO)'
    | 'Packing List'
    | 'Commercial Invoice'
    | 'Bill of Lading';

export type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CompanyEntity {
    name: string;
    address: string;
    taxId: string;
}

export interface TransportDetail {
    portOfLoading: string;
    portOfDischarge: string;
    shipName: string;
    voyage: string;
}

export interface CargoItem {
    description: string;
    quantityGoods?: number;
    goodsUnit?: string;
    quantityPackage?: number;
    packageUnit?: string;
    currency?: string;
    price?: number;
    type?: string;
    brand?: string;
    hsCodePOL?: string;
    hsCodePOD?: string;
    netWeight?: string;
    grossWeight?: string;
    volume?: string;
}

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

    // Detailed fields from Custom Clearance Document PDF spec
    contractNumber?: string;
    termOfShipment?: 'FOB' | 'CIF';
    oceanFreight?: string;
    insuranceFee?: string;
    shipper?: CompanyEntity;
    consignee?: CompanyEntity;
    notifyParty?: CompanyEntity;
    transportDetail?: TransportDetail;
    cargoDetails?: CargoItem[];
    totals?: {
        totalGrossWeight?: string;
        totalPackages?: string;
        totalVolume?: string;
        totalGoods?: string;
        totalPrice?: string;
    };
    relatedDocumentNumbers?: {
        commercialInvoiceNumber?: string;
        commercialInvoiceDate?: string;
        billOfLadingNumber?: string;
        billOfLadingDate?: string;
        cooNumber?: string;
        cooDate?: string;
        packingListNumber?: string;
        insuranceNumber?: string;
    };
    amountInsured?: string;
}

export interface DocumentStats {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
}

