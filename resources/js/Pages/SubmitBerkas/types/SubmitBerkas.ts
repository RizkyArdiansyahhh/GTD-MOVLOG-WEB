/* ════════════════════════════════════════════════════════
    SHARED / COMMON TYPES
   ════════════════════════════════════════════════════════ */

export interface PartyDetail {
  name: string;
  address: string;
  taxId: string;
}

export interface TransportDetail {
  portOfLoading: string;
  portOfDischarge: string;
  shippName: string;
  voyage: string;
}

export type TermOfShipment = 'FOB' | 'CIF';

export interface PdfFile {
  name: string;
  sizeLabel: string;
  url?: string;
  file?: File;
}

export interface Customer {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  picName: string;
}

/* ════════════════════════════════════════════════════════
    STEP 1 — BILL OF LADING
   ════════════════════════════════════════════════════════ */

export interface BolCargoItem {
  id: string;
  descriptionOfGoods: string;
  hsCodePol: string;
  grossWeight: string;
  packages: string;
  volume: string;
}

export interface BillOfLadingData {
  documentDetail: {
    number: string;
    date: string;
  };
  shipper: PartyDetail;
  consignee: PartyDetail;
  notifyParty: PartyDetail;
  transportDetail: TransportDetail;
  cargoDetail: BolCargoItem[];
  quantity: {
    totalGrossWeight: string;
    totalGrossWeightUnit: string;
    totalPackages: string;
    totalPackagesUnit: string;
    totalVolume: string;
    totalVolumeUnit: string;
  };
}

/* ════════════════════════════════════════════════════════
    STEP 2 — COMMERCIAL INVOICE
   ════════════════════════════════════════════════════════ */

export interface CiCargoItem {
  id: string;
  descriptionOfGoods: string;
  quantityOfGoods: string;
  goodsUnitMeasurement: string;
  quantityOfPackage: string;
  packageUnitMeasurement: string;
  currency: string;
  priceOfGoods: string;
  type: string;
  brand: string;
  hsCodePol: string;
  hsCodePod: string;
}

export interface CommercialInvoiceData {
  documentDetail: {
    number: string;
    date: string;
    shipmentContractNumber: string;
    termOfShipment: TermOfShipment;
    oceanFreightCurrency?: string;
    oceanFreight?: string; // only when FOB
    insuranceCurrency?: string;
    insurance?: string;    // only when FOB
  };
  shipper: PartyDetail;
  consignee: PartyDetail;
  transportDetail: TransportDetail;
  cargoDetail: CiCargoItem[];
  totalQuantity: {
    totalPackages: string;
    totalPackagesUnit: string;
    totalGoods: string;
    totalGoodsUnit: string;
    totalPrice: string;
    totalPriceCurrency: string;
  };
}

/* ════════════════════════════════════════════════════════
    STEP 3 — PACKING LIST
   ════════════════════════════════════════════════════════ */

export interface PlCargoItem {
  id: string;
  descriptionOfGoods: string;
  quantityOfGoods: string;
  goodsUnitMeasurement: string;
  quantityOfPackage: string;
  packageUnitMeasurement: string;
  type: string;
  brand: string;
  netWeight: string;
  grossWeight: string;
  volumeDimension: string;
}

export interface PackingListData {
  documentDetail: {
    number: string;
    date: string;
    shipmentContractNumber: string;
    termOfShipment: TermOfShipment;
    oceanFreightCurrency?: string;
    oceanFreight?: string;
    insuranceCurrency?: string;
    insurance?: string;
  };
  shipper: PartyDetail;
  consignee: PartyDetail;
  transportDetail: TransportDetail;
  cargoDetail: PlCargoItem[];
}

/* ════════════════════════════════════════════════════════
    STEP 4 — CERTIFICATE OF ORIGIN (COO)
   ════════════════════════════════════════════════════════ */

export interface CooCargoItem {
  id: string;
  descriptionOfGoods: string;
  quantityOfPackage: string;
  packageUnitMeasurement: string;
  type: string;
  hsCodePol: string;
  netWeight: string;
  grossWeight: string;
  volume: string;
}

export interface CertificateOfOriginData {
  documentDetail: {
    number: string;
    date: string;
  };
  shipper: PartyDetail;
  consignee: PartyDetail;
  transportDetail: TransportDetail;
  cargoDetail: CooCargoItem[];
  commercialInvoiceRef: {
    number: string;
    date: string;
  };
}

/* ════════════════════════════════════════════════════════
    STEP 5 — INSURANCE
   ════════════════════════════════════════════════════════ */

export interface InsuranceCargoItem {
  id: string;
  descriptionOfGoods: string;
  hsCodePol: string;
}

export interface InsuranceData {
  documentReference: {
    commercialInvoiceNumber: string;
    billOfLadingNumber: string;
    shipmentContractNumber: string;
  };
  transportDetail: TransportDetail;
  cargoDetail: InsuranceCargoItem[];
  quantity: {
    totalGrossWeight: string;
    totalGrossWeightUnit: string;
    totalPackages: string;
    totalPackagesUnit: string;
    totalVolume: string;
    totalVolumeUnit: string;
  };
  insurance: {
    amountInsured: string;
  };
}

/* ════════════════════════════════════════════════════════
    WIZARD-LEVEL TYPES
   ════════════════════════════════════════════════════════ */

export type WizardStepKey =
  | 'billOfLading'
  | 'commercialInvoice'
  | 'packingList'
  | 'certificateOfOrigin'
  | 'insurance'
  | 'previewPib';

export type StepStatus = 'upcoming' | 'active' | 'completed';

export interface StepRecord<T> {
  data: T;
  pdf: PdfFile | null;
  completed: boolean;
}

export interface WizardData {
  billOfLading: StepRecord<BillOfLadingData> | null;
  commercialInvoice: StepRecord<CommercialInvoiceData> | null;
  packingList: StepRecord<PackingListData> | null;
  certificateOfOrigin: StepRecord<CertificateOfOriginData> | null;
  insurance: StepRecord<InsuranceData> | null;
}

export interface StepDefinition {
  key: WizardStepKey;
  order: number;
  label: string;
}

/* ════════════════════════════════════════════════════════
    AssignmentSummary 
   ════════════════════════════════════════════════════════ */

export interface AssignmentSummary {
  assignment_no_ref: string;
  customer_id: string;
  customer_name: string;
  customer_pic?: string;
  total_documents: number;
  completed_documents?: number;
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  updated_at?: string;
}

