import type {
    BillOfLadingData,
    CommercialInvoiceData,
    PackingListData,
    CertificateOfOriginData,
    InsuranceData,
    PdfFile,
} from '../types/SubmitBerkas';

export const MOCK_BOL_PDF: PdfFile = {
    name: 'Bill_of_Lading_Sample.pdf',
    sizeLabel: '1.2 MB',
};

export const MOCK_BOL_DATA: BillOfLadingData = {
    documentDetail: {
        number: 'BL-2024-0091',
        date: '2024-11-05',
    },
    shipper: {
        name: 'PT Alat Berat Nusantara',
        address: 'Jl. Industri Raya No. 12, Surabaya, Indonesia',
        taxId: '01.234.567.8-901.000',
    },
    consignee: {
        name: 'PT Tambang Kalimantan Jaya',
        address: 'Jl. Tambang Utama No. 5, Kalimantan Timur, Indonesia',
        taxId: '02.345.678.9-012.000',
    },
    notifyParty: {
        name: 'PT Tambang Kalimantan Jaya',
        address: 'Jl. Tambang Utama No. 5, Kalimantan Timur, Indonesia',
        taxId: '02.345.678.9-012.000',
    },
    transportDetail: {
        portOfLoading: 'Tanjung Priok',
        portOfDischarge: 'Balikpapan',
        shippName: 'MV Borneo Star',
        voyage: 'V.221E',
    },
    cargoDetail: [
        {
            id: 'mock-bol-item-1',
            descriptionOfGoods: 'Excavator CAT 320',
            hsCodePol: '8429.52.00',
            grossWeight: '22500',
            packages: '1',
            volume: '85.5',
        },
        {
            id: 'mock-bol-item-2',
            descriptionOfGoods: 'Bulldozer CAT D6R',
            hsCodePol: '8429.11.00',
            grossWeight: '18400',
            packages: '1',
            volume: '62.3',
        },
    ],
    quantity: {
        totalGrossWeight: '40900',
        totalGrossWeightUnit: 'kg',
        totalPackages: '2',
        totalPackagesUnit: 'Unit',
        totalVolume: '147.8',
        totalVolumeUnit: 'm³',
    },
};

export const MOCK_CI_PDF: PdfFile = {
    name: 'Commercial_Invoice_Sample.pdf',
    sizeLabel: '980 KB',
};

export const MOCK_CI_DATA: CommercialInvoiceData = {
    documentDetail: {
        number: 'CI-2024-0077',
        date: '2024-11-06',
        shipmentContractNumber: 'SC-2024-0456',
        termOfShipment: 'FOB',
        oceanFreightCurrency: 'USD',
        oceanFreight: '3500',
        insuranceCurrency: 'USD',
        insurance: '800',
    },
    shipper: {
        name: 'PT Alat Berat Nusantara',
        address: 'Jl. Industri Raya No. 12, Surabaya, Indonesia',
        taxId: '01.234.567.8-901.000',
    },
    consignee: {
        name: 'PT Tambang Kalimantan Jaya',
        address: 'Jl. Tambang Utama No. 5, Kalimantan Timur, Indonesia',
        taxId: '02.345.678.9-012.000',
    },
    transportDetail: {
        portOfLoading: 'Tanjung Priok',
        portOfDischarge: 'Balikpapan',
        shippName: 'MV Borneo Star',
        voyage: 'V.221E',
    },
    cargoDetail: [
        {
            id: 'mock-ci-item-1',
            descriptionOfGoods: 'Excavator CAT 320',
            quantityOfGoods: '1',
            goodsUnitMeasurement: 'Unit',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            currency: 'USD',
            priceOfGoods: '125000',
            type: 'Hydraulic Excavator',
            brand: 'Caterpillar',
            hsCodePol: '8429.52.00',
            hsCodePod: '8429.52.00',
        },
        {
            id: 'mock-ci-item-2',
            descriptionOfGoods: 'Bulldozer CAT D6R',
            quantityOfGoods: '1',
            goodsUnitMeasurement: 'Unit',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            currency: 'USD',
            priceOfGoods: '98000',
            type: 'Track-Type Tractor',
            brand: 'Caterpillar',
            hsCodePol: '8429.11.00',
            hsCodePod: '8429.11.00',
        },
    ],
    totalQuantity: {
        totalPackages: '2',
        totalPackagesUnit: 'Unit',
        totalGoods: '2',
        totalGoodsUnit: 'Unit',
        totalPrice: '223000',
        totalPriceCurrency: 'USD',
    },
};

export const MOCK_PL_PDF: PdfFile = {
    name: 'Packing_List_Sample.pdf',
    sizeLabel: '870 KB',
};

export const MOCK_PL_DATA: PackingListData = {
    documentDetail: {
        number: 'PL-2024-0077',
        date: '2024-11-06',
        shipmentContractNumber: 'SC-2024-0456',
        termOfShipment: 'FOB',
        oceanFreightCurrency: 'USD',
        oceanFreight: '3500',
        insuranceCurrency: 'USD',
        insurance: '800',
    },
    shipper: {
        name: 'PT Alat Berat Nusantara',
        address: 'Jl. Industri Raya No. 12, Surabaya, Indonesia',
        taxId: '01.234.567.8-901.000',
    },
    consignee: {
        name: 'PT Tambang Kalimantan Jaya',
        address: 'Jl. Tambang Utama No. 5, Kalimantan Timur, Indonesia',
        taxId: '02.345.678.9-012.000',
    },
    transportDetail: {
        portOfLoading: 'Tanjung Priok',
        portOfDischarge: 'Balikpapan',
        shippName: 'MV Borneo Star',
        voyage: 'V.221E',
    },
    cargoDetail: [
        {
            id: 'mock-pl-item-1',
            descriptionOfGoods: 'Excavator CAT 320',
            quantityOfGoods: '1',
            goodsUnitMeasurement: 'Unit',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            type: 'Hydraulic Excavator',
            brand: 'Caterpillar',
            netWeight: '21800',
            grossWeight: '22500',
            volumeDimension: '85.5',
        },
        {
            id: 'mock-pl-item-2',
            descriptionOfGoods: 'Bulldozer CAT D6R',
            quantityOfGoods: '1',
            goodsUnitMeasurement: 'Unit',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            type: 'Track-Type Tractor',
            brand: 'Caterpillar',
            netWeight: '17900',
            grossWeight: '18400',
            volumeDimension: '62.3',
        },
    ],
};

export const MOCK_COO_PDF: PdfFile = {
    name: 'Certificate_of_Origin_Sample.pdf',
    sizeLabel: '650 KB',
};

export const MOCK_COO_DATA: CertificateOfOriginData = {
    documentDetail: {
        number: 'COO-2024-0077',
        date: '2024-11-07',
    },
    shipper: {
        name: 'PT Alat Berat Nusantara',
        address: 'Jl. Industri Raya No. 12, Surabaya, Indonesia',
        taxId: '01.234.567.8-901.000',
    },
    consignee: {
        name: 'PT Tambang Kalimantan Jaya',
        address: 'Jl. Tambang Utama No. 5, Kalimantan Timur, Indonesia',
        taxId: '02.345.678.9-012.000',
    },
    transportDetail: {
        portOfLoading: 'Tanjung Priok',
        portOfDischarge: 'Balikpapan',
        shippName: 'MV Borneo Star',
        voyage: 'V.221E',
    },
    cargoDetail: [
        {
            id: 'mock-coo-item-1',
            descriptionOfGoods: 'Excavator CAT 320',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            type: 'Hydraulic Excavator',
            hsCodePol: '8429.52.00',
            netWeight: '21800',
            grossWeight: '22500',
            volume: '85.5',
        },
        {
            id: 'mock-coo-item-2',
            descriptionOfGoods: 'Bulldozer CAT D6R',
            quantityOfPackage: '1',
            packageUnitMeasurement: 'Unit',
            type: 'Track-Type Tractor',
            hsCodePol: '8429.11.00',
            netWeight: '17900',
            grossWeight: '18400',
            volume: '62.3',
        },
    ],
    commercialInvoiceRef: {
        number: 'CI-2024-0077',
        date: '2024-11-06',
    },
};

export const MOCK_INSURANCE_PDF: PdfFile = {
    name: 'Insurance_Sample.pdf',
    sizeLabel: '540 KB',
};

export const MOCK_INSURANCE_DATA: InsuranceData = {
    documentDetail: {
        number: 'INS-2024-0077',
        date: '2024-11-07',
    },
    documentReference: {
        commercialInvoiceNumber: 'CI-2024-0077',
        billOfLadingNumber: 'BL-2024-0091',
        shipmentContractNumber: 'SC-2024-0456',
    },
    transportDetail: {
        portOfLoading: 'Tanjung Priok',
        portOfDischarge: 'Balikpapan',
        shippName: 'MV Borneo Star',
        voyage: 'V.221E',
    },
    cargoDetail: [
        {
            id: 'mock-ins-item-1',
            descriptionOfGoods: 'Excavator CAT 320',
            hsCodePol: '8429.52.00',
        },
        {
            id: 'mock-ins-item-2',
            descriptionOfGoods: 'Bulldozer CAT D6R',
            hsCodePol: '8429.11.00',
        },
    ],
    quantity: {
        totalGrossWeight: '40900',
        totalGrossWeightUnit: 'kg',
        totalPackages: '2',
        totalPackagesUnit: 'Unit',
        totalVolume: '147.8',
        totalVolumeUnit: 'm³',
    },
    insurance: {
        amountInsured: '800',
    },
};