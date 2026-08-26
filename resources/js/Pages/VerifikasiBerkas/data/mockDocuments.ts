import type { VerificationDocument } from '../types';

/* ─── Shared Entities ─── */

const shipperA = {
    name: 'SHANGHAI LOGISTICS GLOBAL CO., LTD.',
    address: 'No. 888 Century Avenue, Pudong New Area, Shanghai 200120, China',
    taxId: '91310000MA1FL4598X',
};

const shipperB = {
    name: 'NINGBO MARITIME EXPORT CO., LTD.',
    address: 'No. 55 Harbour Road, Beilun Port Zone, Ningbo, China',
    taxId: '91330200MA28189832',
};

const shipperC = {
    name: 'GUANGZHOU PRECISION OPTOELECTRONICS CO., LTD.',
    address: 'No. 102 Tianhe North Road, Tianhe District, Guangzhou, China',
    taxId: '91440101MA59K9281X',
};

const consigneeDefault = {
    name: 'PT GLOBAL TRANS DJAYA',
    address: 'Jl. Boulevard Barat Raya No. 12, Kelapa Gading, Jakarta Utara 14240, Indonesia',
    taxId: '01.234.567.8-012.000',
};

const notifyPartyDefault = {
    name: 'PT DJAYA LOGISTIK INDONESIA',
    address: 'Kawasan Industri MM2100 Blok B3, Cikarang Barat, Bekasi, Jawa Barat 17530',
    taxId: '02.987.654.3-045.000',
};

/* ─── Transport Details ─── */

const transportA = {
    portOfLoading: 'Port of Shanghai, China (CNSHA)',
    portOfDischarge: 'Tanjung Priok, Jakarta, Indonesia (IDTPP)',
    shipName: 'MV OCEAN STAR',
    voyage: 'VOY-2026-088E',
};

const transportB_BOL = {
    portOfLoading: 'Port of Ningbo, China (CNNGB)',
    portOfDischarge: 'Tanjung Priok, Jakarta (IDTPP)',
    shipName: 'MV PACIFIC FREIGHT',
    voyage: 'VOY-2026-092W',
};

// Deliberately different portOfLoading for mismatch demo in Shipment 2
const transportB_PL = {
    portOfLoading: 'Port of Shanghai, China (CNSHA)',
    portOfDischarge: 'Tanjung Priok, Jakarta (IDTPP)',
    shipName: 'MV PACIFIC FREIGHT',
    voyage: 'VOY-2026-092W',
};

const transportB_CI = {
    portOfLoading: 'Port of Ningbo, China (CNNGB)',
    portOfDischarge: 'Tanjung Priok, Jakarta (IDTPP)',
    shipName: 'MV PACIFIC FREIGHT',
    voyage: 'VOY-2026-092W',
};

const transportC = {
    portOfLoading: 'Port of Guangzhou, China (CNGZG)',
    portOfDischarge: 'Tanjung Perak, Surabaya, Indonesia (IDSUB)',
    shipName: 'MV ASIAN VOYAGER',
    voyage: 'VOY-2026-104S',
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT 1 — CTR-GTD-2026-004
   5 documents: all 5 Pending -> 0/5 lengkap (High priority: pending verifikasi)
   ═══════════════════════════════════════════════════════════════════════════ */

const shipment1_CI: VerificationDocument = {
    id: 'doc-s1-ci',
    documentNumber: 'INV-2026-014',
    documentType: 'Commercial Invoice',
    title: 'Commercial Invoice INV-2026-014',
    uploadedBy: 'PT Customer A',
    uploadDate: '2026-08-02 11:30',
    timeAgo: '3 jam yang lalu',
    shipmentReference: 'SHP-GTD-88219',
    status: 'Pending',
    notes: 'Mohon verifikasi kelengkapan nilai faktur komersial dan rincian harga satuan barang elektronik.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-004',
    termOfShipment: 'FOB',
    oceanFreight: 'USD 2,450.00',
    insuranceFee: 'USD 350.00',
    shipper: shipperA,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Automation PLC Control Module',
            quantityGoods: 120,
            goodsUnit: 'PCS',
            quantityPackage: 24,
            packageUnit: 'CTNS',
            currency: 'USD ($)',
            price: 450,
            type: 'Electronic Equipment',
            brand: 'SIEMENS',
            hsCodePOL: '8537.10.99',
            hsCodePOD: '8537.10.99',
            netWeight: '1,200.00 KGS',
            grossWeight: '1,350.00 KGS',
            volume: '4.80 CBM',
        },
        {
            description: 'High-Speed Servo Motor Assembly',
            quantityGoods: 60,
            goodsUnit: 'UNITS',
            quantityPackage: 15,
            packageUnit: 'WOODEN BOX',
            currency: 'USD ($)',
            price: 820,
            type: 'Heavy Machinery Motor',
            brand: 'YASKAWA',
            hsCodePOL: '8501.52.20',
            hsCodePOD: '8501.52.20',
            netWeight: '2,100.00 KGS',
            grossWeight: '2,300.00 KGS',
            volume: '6.50 CBM',
        },
    ],
    totals: {
        totalPackages: '39 Packages',
        totalGoods: '180 Items',
        totalPrice: 'USD 103,200.00',
        totalGrossWeight: '3,650.00 KGS',
        totalVolume: '11.30 CBM',
    },
    relatedDocumentNumbers: {
        billOfLadingNumber: 'BOL-2026-88219',
        packingListNumber: 'PKL-2026-014',
        cooNumber: 'COO-2026-CN-88219',
        insuranceNumber: 'INS-2026-99014',
    },
    amountInsured: 'USD 115,000.00',
};

const shipment1_BOL: VerificationDocument = {
    id: 'doc-s1-bol',
    documentNumber: 'BOL-2026-88219',
    documentType: 'Bill of Lading',
    title: 'Bill of Lading BOL-2026-88219',
    uploadedBy: 'PT Customer A',
    uploadDate: '2026-08-02 11:00',
    timeAgo: '3 jam yang lalu',
    shipmentReference: 'SHP-GTD-88219',
    status: 'Pending',
    notes: 'Dokumen muatan utama shipment CTR-GTD-2026-004.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-004',
    shipper: shipperA,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Automation PLC Control Module + Servo Motor Assembly',
            hsCodePOL: '8537.10.99',
            hsCodePOD: '8537.10.99',
            quantityPackage: 39,
            packageUnit: 'PACKAGES',
            grossWeight: '3,650.00 KGS',
            volume: '11.30 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '3,650.00 KGS',
        totalPackages: '39 PACKAGES',
        totalVolume: '11.30 CBM',
    },
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-014',
        commercialInvoiceDate: '2026-08-01',
    },
};

const shipment1_PL: VerificationDocument = {
    id: 'doc-s1-pl',
    documentNumber: 'PKL-2026-014',
    documentType: 'Packing List',
    title: 'Packing List PKL-2026-014',
    uploadedBy: 'PT Customer A',
    uploadDate: '2026-08-02 10:45',
    timeAgo: '4 jam yang lalu',
    shipmentReference: 'SHP-GTD-88219',
    status: 'Pending',
    notes: 'Daftar rincian koli dan berat kargo elektronik.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-004',
    termOfShipment: 'FOB',
    shipper: shipperA,
    consignee: consigneeDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Automation PLC Control Module',
            quantityGoods: 120,
            goodsUnit: 'PCS',
            quantityPackage: 24,
            packageUnit: 'CTNS',
            type: 'Electronic Equipment',
            brand: 'SIEMENS',
            netWeight: '1,200.00 KGS',
            grossWeight: '1,350.00 KGS',
            volume: '4.80 CBM',
        },
        {
            description: 'High-Speed Servo Motor Assembly',
            quantityGoods: 60,
            goodsUnit: 'UNITS',
            quantityPackage: 15,
            packageUnit: 'WOODEN BOX',
            type: 'Heavy Machinery Motor',
            brand: 'YASKAWA',
            netWeight: '2,100.00 KGS',
            grossWeight: '2,300.00 KGS',
            volume: '6.50 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '3,650.00 KGS',
        totalPackages: '39 Packages',
        totalVolume: '11.30 CBM',
    },
};

const shipment1_INS: VerificationDocument = {
    id: 'doc-s1-ins',
    documentNumber: 'INS-2026-99014',
    documentType: 'Insurance',
    title: 'Polis Asuransi Pengiriman INS-2026-99014',
    uploadedBy: 'PT Customer A',
    uploadDate: '2026-08-02 10:30',
    timeAgo: '4 jam yang lalu',
    shipmentReference: 'SHP-GTD-88219',
    status: 'Pending',
    notes: 'Sertifikat asuransi cargo all-risk untuk shipment CTR-GTD-2026-004.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-004',
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Automation PLC Control Module + Servo Motor Assembly',
            hsCodePOL: '8537.10.99',
        },
    ],
    totals: {
        totalGrossWeight: '3,650.00 KGS',
        totalPackages: '39 PACKAGES',
        totalVolume: '11.30 CBM',
    },
    amountInsured: 'USD 115,000.00',
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-014',
        billOfLadingNumber: 'BOL-2026-88219',
    },
};

const shipment1_COO: VerificationDocument = {
    id: 'doc-s1-coo',
    documentNumber: 'COO-2026-CN-88219',
    documentType: 'Certificate of Origin (COO)',
    title: 'Certificate of Origin COO-2026-CN-88219',
    uploadedBy: 'PT Customer A',
    uploadDate: '2026-08-02 10:15',
    timeAgo: '4 jam yang lalu',
    shipmentReference: 'SHP-GTD-88219',
    status: 'Pending',
    notes: 'Surat Keterangan Asal (SKA / COO Form E) shipment CTR-GTD-2026-004.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-004',
    shipper: shipperA,
    consignee: consigneeDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Automation PLC Control Module + Servo Motor Assembly',
            quantityPackage: 39,
            packageUnit: 'PACKAGES',
            type: 'Electronic Equipment',
            hsCodePOL: '8537.10.99',
            netWeight: '3,300.00 KGS',
            grossWeight: '3,650.00 KGS',
            volume: '11.30 CBM',
        },
    ],
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-014',
        commercialInvoiceDate: '2026-08-01',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT 2 — CTR-GTD-2026-009
   5 documents: 1 Approved (PL), 4 Pending (BOL, CI, INS, COO) -> 1/5 lengkap
   Mismatch: PL has different portOfLoading (Shanghai) than BOL/CI/COO (Ningbo)
   ═══════════════════════════════════════════════════════════════════════════ */

const shipment2_BOL: VerificationDocument = {
    id: 'doc-s2-bol',
    documentNumber: 'BOL-2026-015',
    documentType: 'Bill of Lading',
    title: 'Bill of Lading BOL-2026-015',
    uploadedBy: 'PT Logistik Maju Jaya',
    uploadDate: '2026-08-02 10:15',
    timeAgo: '4 jam yang lalu',
    shipmentReference: 'SHP-GTD-88220',
    status: 'Pending',
    notes: 'Dokumen muatan perairan — perlu cross-check dengan Packing List.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-009',
    termOfShipment: 'CIF',
    shipper: shipperB,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportB_BOL,
    cargoDetails: [
        {
            description: 'Containerized Commercial Hardware Tools & Fasteners',
            hsCodePOL: '7318.15.00',
            hsCodePOD: '7318.15.00',
            quantityPackage: 150,
            packageUnit: 'PALLETS',
            grossWeight: '12,450.00 KGS',
            volume: '38.50 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '12,450.00 KGS',
        totalPackages: '150 PALLETS',
        totalVolume: '38.50 CBM',
    },
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-015',
        commercialInvoiceDate: '2026-07-30',
    },
    amountInsured: 'USD 85,000.00',
};

const shipment2_CI: VerificationDocument = {
    id: 'doc-s2-ci',
    documentNumber: 'INV-2026-015',
    documentType: 'Commercial Invoice',
    title: 'Commercial Invoice INV-2026-015',
    uploadedBy: 'PT Logistik Maju Jaya',
    uploadDate: '2026-08-02 09:50',
    timeAgo: '5 jam yang lalu',
    shipmentReference: 'SHP-GTD-88220',
    status: 'Pending',
    notes: 'Invoice hardware tools impor dari Ningbo.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-009',
    termOfShipment: 'CIF',
    oceanFreight: 'USD 3,800.00',
    insuranceFee: 'USD 520.00',
    shipper: shipperB,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportB_CI,
    cargoDetails: [
        {
            description: 'Commercial Hardware Tools & Fasteners Assortment',
            quantityGoods: 5000,
            goodsUnit: 'PCS',
            quantityPackage: 150,
            packageUnit: 'PALLETS',
            currency: 'USD ($)',
            price: 14.5,
            type: 'Hardware Tools',
            brand: 'STANLEY OEM',
            hsCodePOL: '7318.15.00',
            hsCodePOD: '7318.15.00',
            netWeight: '11,800.00 KGS',
            grossWeight: '12,450.00 KGS',
            volume: '38.50 CBM',
        },
    ],
    totals: {
        totalPackages: '150 PALLETS',
        totalGoods: '5,000 PCS',
        totalPrice: 'USD 72,500.00',
        totalGrossWeight: '12,450.00 KGS',
        totalVolume: '38.50 CBM',
    },
    relatedDocumentNumbers: {
        billOfLadingNumber: 'BOL-2026-015',
        packingListNumber: 'PKL-2026-015',
        insuranceNumber: 'INS-2026-015',
    },
    amountInsured: 'USD 85,000.00',
};

const shipment2_PL: VerificationDocument = {
    id: 'doc-s2-pl',
    documentNumber: 'PKL-2026-015',
    documentType: 'Packing List',
    title: 'Packing List PKL-2026-015',
    uploadedBy: 'PT Logistik Maju Jaya',
    uploadDate: '2026-08-01 15:00',
    timeAgo: '1 hari yang lalu',
    shipmentReference: 'SHP-GTD-88220',
    status: 'Approved',
    notes: 'Telah diverifikasi dan disetujui.',
    verifiedBy: 'Supervisor Budi Santoso',
    verifiedAt: '02 Aug 2026, 08:30 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-009',
    termOfShipment: 'CIF',
    shipper: shipperB,
    consignee: consigneeDefault,
    // ⚠️ MISMATCH: portOfLoading is Shanghai, but BOL/CI say Ningbo
    transportDetail: transportB_PL,
    cargoDetails: [
        {
            description: 'Commercial Hardware Tools & Fasteners Assortment',
            quantityGoods: 5000,
            goodsUnit: 'PCS',
            quantityPackage: 150,
            packageUnit: 'PALLETS',
            type: 'Hardware Tools',
            brand: 'STANLEY OEM',
            netWeight: '11,800.00 KGS',
            grossWeight: '12,450.00 KGS',
            volume: '38.50 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '12,450.00 KGS',
        totalPackages: '150 PALLETS',
        totalVolume: '38.50 CBM',
    },
};

const shipment2_INS: VerificationDocument = {
    id: 'doc-s2-ins',
    documentNumber: 'INS-2026-015',
    documentType: 'Insurance',
    title: 'Polis Asuransi Pengiriman INS-2026-015',
    uploadedBy: 'PT Logistik Maju Jaya',
    uploadDate: '2026-08-02 09:00',
    timeAgo: '5 jam yang lalu',
    shipmentReference: 'SHP-GTD-88220',
    status: 'Pending',
    notes: 'Polis asuransi pengiriman hardware tools dari Ningbo.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-009',
    transportDetail: transportB_BOL,
    cargoDetails: [
        {
            description: 'Commercial Hardware Tools & Fasteners',
            hsCodePOL: '7318.15.00',
        },
    ],
    totals: {
        totalGrossWeight: '12,450.00 KGS',
        totalPackages: '150 PALLETS',
        totalVolume: '38.50 CBM',
    },
    amountInsured: 'USD 85,000.00',
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-015',
        billOfLadingNumber: 'BOL-2026-015',
    },
};

const shipment2_COO: VerificationDocument = {
    id: 'doc-s2-coo',
    documentNumber: 'COO-2026-015',
    documentType: 'Certificate of Origin (COO)',
    title: 'Certificate of Origin COO-2026-015',
    uploadedBy: 'PT Logistik Maju Jaya',
    uploadDate: '2026-08-02 08:30',
    timeAgo: '6 jam yang lalu',
    shipmentReference: 'SHP-GTD-88220',
    status: 'Pending',
    notes: 'Surat Keterangan Asal Ningbo Trade Chamber.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-009',
    shipper: shipperB,
    consignee: consigneeDefault,
    transportDetail: transportB_BOL,
    cargoDetails: [
        {
            description: 'Commercial Hardware Tools & Fasteners',
            quantityPackage: 150,
            packageUnit: 'PALLETS',
            type: 'Hardware Tools',
            hsCodePOL: '7318.15.00',
            netWeight: '11,800.00 KGS',
            grossWeight: '12,450.00 KGS',
            volume: '38.50 CBM',
        },
    ],
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-015',
        commercialInvoiceDate: '2026-07-30',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT 3 — CTR-GTD-2026-001
   5 documents: 2 Approved (BOL, COO), 1 Rejected (CI), 2 Pending (PL, INS)
   -> 2/5 lengkap (High priority: pending verifikasi)
   ═══════════════════════════════════════════════════════════════════════════ */

const shipment3_CI: VerificationDocument = {
    id: 'doc-s3-ci',
    documentNumber: 'INV-2026-012',
    documentType: 'Commercial Invoice',
    title: 'Commercial Invoice INV-2026-012',
    uploadedBy: 'PT Lintas Samudera',
    uploadDate: '2026-07-30 17:20',
    timeAgo: '3 hari yang lalu',
    shipmentReference: 'SHP-GTD-88215',
    status: 'Rejected',
    notes: 'Ditolak: Tanggal transaksi faktur tidak sesuai dengan manifest barang.',
    rejectionReason: 'Tanggal transaksi faktur tidak sesuai dengan manifest barang. Harap lampirkan revisi faktur resmi.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '30 Jul 2026, 18:05 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-001',
    termOfShipment: 'FOB',
    shipper: shipperA,
    consignee: consigneeDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Air Conditioning Chiller Units',
            quantityGoods: 8,
            goodsUnit: 'UNITS',
            quantityPackage: 8,
            packageUnit: 'CRATES',
            currency: 'USD ($)',
            price: 12500,
            type: 'HVAC Equipment',
            brand: 'DAIKIN INDUSTRIAL',
            hsCodePOL: '8415.81.90',
            hsCodePOD: '8415.81.90',
            netWeight: '5,800.00 KGS',
            grossWeight: '6,400.00 KGS',
            volume: '22.00 CBM',
        },
    ],
    totals: {
        totalPackages: '8 CRATES',
        totalGoods: '8 UNITS',
        totalPrice: 'USD 100,000.00',
        totalGrossWeight: '6,400.00 KGS',
        totalVolume: '22.00 CBM',
    },
};

const shipment3_BOL: VerificationDocument = {
    id: 'doc-s3-bol',
    documentNumber: 'BOL-2026-010',
    documentType: 'Bill of Lading',
    title: 'Bill of Lading BOL-2026-010',
    uploadedBy: 'PT Lintas Samudera',
    uploadDate: '2026-07-31 15:30',
    timeAgo: '2 hari yang lalu',
    shipmentReference: 'SHP-GTD-88215',
    status: 'Approved',
    notes: 'Dokumen persetujuan lengkap dan cap tanda tangan pengangkut sah.',
    verifiedBy: 'Supervisor Budi Santoso',
    verifiedAt: '31 Jul 2026, 16:00 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-001',
    shipper: shipperA,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Air Conditioning Chiller Units',
            hsCodePOL: '8415.81.90',
            quantityPackage: 8,
            packageUnit: 'CRATES',
            grossWeight: '6,400.00 KGS',
            volume: '22.00 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '6,400.00 KGS',
        totalPackages: '8 CRATES',
        totalVolume: '22.00 CBM',
    },
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-012',
        commercialInvoiceDate: '2026-07-25',
    },
};

const shipment3_PL: VerificationDocument = {
    id: 'doc-s3-pl',
    documentNumber: 'PKL-2026-010',
    documentType: 'Packing List',
    title: 'Packing List PKL-2026-010',
    uploadedBy: 'PT Lintas Samudera',
    uploadDate: '2026-07-31 14:00',
    timeAgo: '2 hari yang lalu',
    shipmentReference: 'SHP-GTD-88215',
    status: 'Pending',
    notes: 'Rincian 8 crates chiller units.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-001',
    termOfShipment: 'FOB',
    shipper: shipperA,
    consignee: consigneeDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Air Conditioning Chiller Units',
            quantityGoods: 8,
            goodsUnit: 'UNITS',
            quantityPackage: 8,
            packageUnit: 'CRATES',
            type: 'HVAC Equipment',
            brand: 'DAIKIN INDUSTRIAL',
            netWeight: '5,800.00 KGS',
            grossWeight: '6,400.00 KGS',
            volume: '22.00 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '6,400.00 KGS',
        totalPackages: '8 CRATES',
        totalVolume: '22.00 CBM',
    },
};

const shipment3_INS: VerificationDocument = {
    id: 'doc-s3-ins',
    documentNumber: 'INS-2026-010',
    documentType: 'Insurance',
    title: 'Polis Asuransi Pengiriman INS-2026-010',
    uploadedBy: 'PT Lintas Samudera',
    uploadDate: '2026-07-31 13:30',
    timeAgo: '2 hari yang lalu',
    shipmentReference: 'SHP-GTD-88215',
    status: 'Pending',
    notes: 'Polis asuransi pengiriman chiller equipment.',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-001',
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Air Conditioning Chiller Units',
            hsCodePOL: '8415.81.90',
        },
    ],
    totals: {
        totalGrossWeight: '6,400.00 KGS',
        totalPackages: '8 CRATES',
        totalVolume: '22.00 CBM',
    },
    amountInsured: 'USD 110,000.00',
};

const shipment3_COO: VerificationDocument = {
    id: 'doc-s3-coo',
    documentNumber: 'COO-2026-011',
    documentType: 'Certificate of Origin (COO)',
    title: 'Certificate of Origin COO-2026-011',
    uploadedBy: 'PT Lintas Samudera',
    uploadDate: '2026-07-31 13:00',
    timeAgo: '2 hari yang lalu',
    shipmentReference: 'SHP-GTD-88215',
    status: 'Approved',
    notes: 'Telah disetujui Supervisor setelah validasi barcode instansi penerbit.',
    verifiedBy: 'Supervisor Budi Santoso',
    verifiedAt: '31 Jul 2026, 14:15 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-001',
    shipper: shipperA,
    consignee: consigneeDefault,
    transportDetail: transportA,
    cargoDetails: [
        {
            description: 'Industrial Air Conditioning Chiller Units',
            quantityPackage: 8,
            packageUnit: 'CRATES',
            type: 'HVAC Equipment',
            hsCodePOL: '8415.81.90',
            netWeight: '5,800.00 KGS',
            grossWeight: '6,400.00 KGS',
            volume: '22.00 CBM',
        },
    ],
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-012',
        commercialInvoiceDate: '2026-07-25',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT 4 — CTR-GTD-2026-015
   5 documents: ALL 5 APPROVED -> 5/5 lengkap (Low priority: completed)
   ═══════════════════════════════════════════════════════════════════════════ */

const shipment4_CI: VerificationDocument = {
    id: 'doc-s4-ci',
    documentNumber: 'INV-2026-099',
    documentType: 'Commercial Invoice',
    title: 'Commercial Invoice INV-2026-099',
    uploadedBy: 'PT Surya Optika Indonesia',
    uploadDate: '2026-07-28 10:00',
    timeAgo: '5 hari yang lalu',
    shipmentReference: 'SHP-GTD-88100',
    status: 'Approved',
    notes: 'Nilai faktur dan spesifikasi lensa optik presisi terverifikasi sesuai.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '28 Jul 2026, 14:00 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-015',
    termOfShipment: 'CIF',
    oceanFreight: 'USD 1,850.00',
    insuranceFee: 'USD 280.00',
    shipper: shipperC,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportC,
    cargoDetails: [
        {
            description: 'High Precision Industrial Optical Lenses',
            quantityGoods: 1000,
            goodsUnit: 'PCS',
            quantityPackage: 20,
            packageUnit: 'BOXES',
            currency: 'USD ($)',
            price: 55,
            type: 'Optical Components',
            brand: 'OPTIC TECH',
            hsCodePOL: '9001.90.00',
            hsCodePOD: '9001.90.00',
            netWeight: '800.00 KGS',
            grossWeight: '950.00 KGS',
            volume: '3.20 CBM',
        },
    ],
    totals: {
        totalPackages: '20 BOXES',
        totalGoods: '1,000 PCS',
        totalPrice: 'USD 55,000.00',
        totalGrossWeight: '950.00 KGS',
        totalVolume: '3.20 CBM',
    },
};

const shipment4_BOL: VerificationDocument = {
    id: 'doc-s4-bol',
    documentNumber: 'BOL-2026-099',
    documentType: 'Bill of Lading',
    title: 'Bill of Lading BOL-2026-099',
    uploadedBy: 'PT Surya Optika Indonesia',
    uploadDate: '2026-07-28 09:30',
    timeAgo: '5 hari yang lalu',
    shipmentReference: 'SHP-GTD-88100',
    status: 'Approved',
    notes: 'Bill of Lading valid, manifest sesuai.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '28 Jul 2026, 14:15 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-015',
    shipper: shipperC,
    consignee: consigneeDefault,
    notifyParty: notifyPartyDefault,
    transportDetail: transportC,
    cargoDetails: [
        {
            description: 'High Precision Industrial Optical Lenses',
            hsCodePOL: '9001.90.00',
            quantityPackage: 20,
            packageUnit: 'BOXES',
            grossWeight: '950.00 KGS',
            volume: '3.20 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '950.00 KGS',
        totalPackages: '20 BOXES',
        totalVolume: '3.20 CBM',
    },
};

const shipment4_PL: VerificationDocument = {
    id: 'doc-s4-pl',
    documentNumber: 'PKL-2026-099',
    documentType: 'Packing List',
    title: 'Packing List PKL-2026-099',
    uploadedBy: 'PT Surya Optika Indonesia',
    uploadDate: '2026-07-28 09:00',
    timeAgo: '5 hari yang lalu',
    shipmentReference: 'SHP-GTD-88100',
    status: 'Approved',
    notes: 'Daftar rincian koli telah dicocokkan dengan packing box.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '28 Jul 2026, 14:30 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-015',
    termOfShipment: 'CIF',
    shipper: shipperC,
    consignee: consigneeDefault,
    transportDetail: transportC,
    cargoDetails: [
        {
            description: 'High Precision Industrial Optical Lenses',
            quantityGoods: 1000,
            goodsUnit: 'PCS',
            quantityPackage: 20,
            packageUnit: 'BOXES',
            type: 'Optical Components',
            brand: 'OPTIC TECH',
            netWeight: '800.00 KGS',
            grossWeight: '950.00 KGS',
            volume: '3.20 CBM',
        },
    ],
    totals: {
        totalGrossWeight: '950.00 KGS',
        totalPackages: '20 BOXES',
        totalVolume: '3.20 CBM',
    },
};

const shipment4_INS: VerificationDocument = {
    id: 'doc-s4-ins',
    documentNumber: 'INS-2026-099',
    documentType: 'Insurance',
    title: 'Polis Asuransi Pengiriman INS-2026-099',
    uploadedBy: 'PT Surya Optika Indonesia',
    uploadDate: '2026-07-28 08:30',
    timeAgo: '5 hari yang lalu',
    shipmentReference: 'SHP-GTD-88100',
    status: 'Approved',
    notes: 'Sertifikat polis asuransi all-risk lengkap.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '28 Jul 2026, 14:45 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-015',
    transportDetail: transportC,
    cargoDetails: [
        {
            description: 'High Precision Industrial Optical Lenses',
            hsCodePOL: '9001.90.00',
        },
    ],
    totals: {
        totalGrossWeight: '950.00 KGS',
        totalPackages: '20 BOXES',
        totalVolume: '3.20 CBM',
    },
    amountInsured: 'USD 60,000.00',
};

const shipment4_COO: VerificationDocument = {
    id: 'doc-s4-coo',
    documentNumber: 'COO-2026-CN-099',
    documentType: 'Certificate of Origin (COO)',
    title: 'Certificate of Origin COO-2026-CN-099',
    uploadedBy: 'PT Surya Optika Indonesia',
    uploadDate: '2026-07-28 08:00',
    timeAgo: '5 hari yang lalu',
    shipmentReference: 'SHP-GTD-88100',
    status: 'Approved',
    notes: 'COO Form E sah dan terotentikasi.',
    verifiedBy: 'Supervisor Siti Rahma',
    verifiedAt: '28 Jul 2026, 15:00 WIB',
    previewUrl: '',
    contractNumber: 'CTR-GTD-2026-015',
    shipper: shipperC,
    consignee: consigneeDefault,
    transportDetail: transportC,
    cargoDetails: [
        {
            description: 'High Precision Industrial Optical Lenses',
            quantityPackage: 20,
            packageUnit: 'BOXES',
            type: 'Optical Components',
            hsCodePOL: '9001.90.00',
            netWeight: '800.00 KGS',
            grossWeight: '950.00 KGS',
            volume: '3.20 CBM',
        },
    ],
    relatedDocumentNumbers: {
        commercialInvoiceNumber: 'INV-2026-099',
        commercialInvoiceDate: '2026-07-27',
    },
};

/* ─── Combined Export ─── */

export const mockDocuments: VerificationDocument[] = [
    // Shipment 1 — CTR-GTD-2026-004 (5 docs, all 5 pending -> 0/5 lengkap)
    shipment1_CI,
    shipment1_BOL,
    shipment1_PL,
    shipment1_INS,
    shipment1_COO,

    // Shipment 2 — CTR-GTD-2026-009 (5 docs: 1 approved, 4 pending -> 1/5 lengkap)
    shipment2_BOL,
    shipment2_CI,
    shipment2_PL,
    shipment2_INS,
    shipment2_COO,

    // Shipment 3 — CTR-GTD-2026-001 (5 docs: 2 approved, 1 rejected, 2 pending -> 2/5 lengkap)
    shipment3_BOL,
    shipment3_COO,
    shipment3_CI,
    shipment3_PL,
    shipment3_INS,

    // Shipment 4 — CTR-GTD-2026-015 (5 docs: all 5 approved -> 5/5 lengkap)
    shipment4_CI,
    shipment4_BOL,
    shipment4_PL,
    shipment4_INS,
    shipment4_COO,
];
