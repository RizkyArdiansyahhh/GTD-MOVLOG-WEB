import { FileText } from 'lucide-react';
import type { SupportedDocumentType, VerificationDocument } from '../types';

type Data = Record<string, unknown>;
type Field = readonly [key: string, label: string];
const documentFields: Field[] = [['number', 'Number'], ['date', 'Date']];
const partyFields: Field[] = [['name', 'Name'], ['taxId', 'Tax ID'], ['address', 'Address']];
const transportFields: Field[] = [
    ['portOfLoading', 'Port of Loading'], ['portOfDischarge', 'Port of Discharge'],
    ['shippName', 'Ship Name'], ['voyage', 'Voyage'],
];
const tradeFields: Field[] = [
    ...documentFields, ['shipmentContractNumber', 'Shipment Contract Number'], ['termOfShipment', 'Term of Shipment'],
];
const freightFields: Field[] = [
    ['oceanFreight', 'Ocean Freight'], ['oceanFreightCurrency', 'Ocean Freight Currency'],
    ['insurance', 'Insurance'], ['insuranceCurrency', 'Insurance Currency'],
];
const referenceFields: Field[] = [
    ['commercialInvoiceNumber', 'Commercial Invoice Number'], ['billOfLadingNumber', 'Bill of Lading Number'],
    ['shipmentContractNumber', 'Shipment Contract Number'],
];
const quantityFields: Field[] = [
    ['totalGrossWeight', 'Total Gross Weight'], ['totalGrossWeightUnit', 'Gross Weight Unit'],
    ['totalPackages', 'Total Packages'], ['totalPackagesUnit', 'Packages Unit'],
    ['totalVolume', 'Total Volume'], ['totalVolumeUnit', 'Volume Unit'],
];
const invoiceQuantityFields: Field[] = [
    ['totalPackages', 'Total Packages'], ['totalPackagesUnit', 'Packages Unit'],
    ['totalGoods', 'Total Goods'], ['totalGoodsUnit', 'Goods Unit'],
    ['totalPrice', 'Total Price'], ['totalPriceCurrency', 'Total Price Currency'],
];
const description: Field = ['descriptionOfGoods', 'Description of Goods'];
const goodsFields: Field[] = [['quantityOfGoods', 'Quantity of Goods'], ['goodsUnitMeasurement', 'Goods Unit']];
const packageFields: Field[] = [['quantityOfPackage', 'Quantity of Package'], ['packageUnitMeasurement', 'Package Unit']];
const productFields: Field[] = [['type', 'Type'], ['brand', 'Brand']];
const hsPol: Field = ['hsCodePol', 'HS Code POL'];
const cargoFields: Record<SupportedDocumentType, Field[]> = {
    'Bill of Lading': [description, hsPol, ['grossWeight', 'Gross Weight'], ['packages', 'Packages'], ['volume', 'Volume']],
    'Commercial Invoice': [
        description, ...productFields, ...goodsFields, ...packageFields,
        ['priceOfGoods', 'Price of Goods'], ['currency', 'Currency'], hsPol, ['hsCodePod', 'HS Code POD'],
    ],
    'Packing List': [
        description, ...productFields, ...goodsFields, ...packageFields,
        ['netWeight', 'Net Weight'], ['grossWeight', 'Gross Weight'], ['volumeDimension', 'Volume / Dimension'],
    ],
    'Certificate of Origin (COO)': [
        description, ['type', 'Type'], hsPol, ...packageFields,
        ['netWeight', 'Net Weight'], ['grossWeight', 'Gross Weight'], ['volume', 'Volume'],
    ],
    'Insurance': [description, hsPol],
};

function asData(value: unknown): Data {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Data : {};
}

function displayValue(value: unknown): string {
    if (typeof value === 'string') return value.trim() ? value : '—';
    if (typeof value === 'number') return String(value);
    return '—';
}

// Match the summary cards in Submit Berkas, with wrapping for the narrower verification panel.
function DataSection({ title, data, fields }: { title: string; data: unknown; fields: Field[] }) {
    const values = asData(data);
    return (
        <section aria-label={title} className="soft-surface overflow-hidden  border border-[#E5E7EB] bg-soft-surface">
            <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] bg-[#FAFBFC] px-5 py-3.5">
                <FileText size={16} className="shrink-0 text-[#06283A]" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-[#06283A]">{title}</h4>
            </div>
            <dl>
                {fields.map(([key, label]) => (
                    <div key={key} className="grid grid-cols-2 gap-4 border-b border-[#F8FAFC] px-5 py-2.5 text-[13px] last:border-b-0">
                        <dt className="min-w-0 text-[#6B7280]">{label}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap break-words text-right font-semibold text-[#06283A]">
                            {displayValue(values[key])}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

// Older saved documents can carry these fields even though the current wizard does not.
function withSavedFields(fields: Field[], value: unknown, optional: Field[]): Field[] {
    const data = asData(value);
    return [...fields, ...optional.filter(([key]) => key in data)];
}

export default function SubmittedDataPanel({ document }: { document: VerificationDocument | null }) {
    if (!document) {
        return <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Pilih dokumen untuk melihat data input.</p>;
    }

    // Raw saved data is authoritative. Aliases support older responses without documentData.
    const data: Data = document.documentData ?? {
        documentDetail: document.documentDetail,
        documentReference: document.documentReference,
        shipper: document.shipper,
        consignee: document.consignee,
        notifyParty: document.notifyParty,
        transportDetail: document.transportDetail,
        cargoDetail: document.cargoDetails,
        quantity: document.quantityDetail ?? document.totals,
        insurance: document.insuranceDetail,
    };
    const type = document.documentType;
    const detail = asData(data.documentDetail);
    const isTrade = type === 'Commercial Invoice' || type === 'Packing List';
    let detailFields = isTrade ? tradeFields : documentFields;
    if (isTrade && detail.termOfShipment === 'FOB') detailFields = [...detailFields, ...freightFields];
    detailFields = withSavedFields(detailFields, detail, [
        ['policyNumber', 'Policy Number'], ['company', 'Company'],
        ['issuedDate', 'Issued Date'], ['countryOfOrigin', 'Country of Origin'],
    ]);
    const cargo = Array.isArray(data.cargoDetail) ? data.cargoDetail : [];
    const quantity = data.quantity ?? data.totalQuantity;
    const hasQuantity = type === 'Bill of Lading' || type === 'Commercial Invoice' || type === 'Insurance' || quantity != null;

    return (
        <div className="space-y-3">
            <p className="text-xs text-slate-500">Data form yang disimpan saat submit untuk {type}.</p>
            <DataSection title="Document Detail" data={detail} fields={detailFields} />
            {type !== 'Insurance' && (
                <>
                    <DataSection title="Shipper" data={data.shipper} fields={partyFields} />
                    <DataSection title="Consignee" data={data.consignee} fields={partyFields} />
                </>
            )}
            {type === 'Bill of Lading' && <DataSection title="Notify Party" data={data.notifyParty} fields={partyFields} />}
            {type === 'Certificate of Origin (COO)' && (
                <DataSection title="Commercial Invoice Reference" data={data.commercialInvoiceRef} fields={documentFields} />
            )}
            {(type === 'Insurance' || data.documentReference != null) && (
                <DataSection title="Document Reference" data={data.documentReference} fields={referenceFields} />
            )}
            <DataSection title="Transport Detail" data={data.transportDetail} fields={transportFields} />
            {cargo.length > 0 ? cargo.map((item, index) => (
                <DataSection key={index} title={`Cargo Detail ${index + 1}`} data={item} fields={cargoFields[type]} />
            )) : <DataSection title="Cargo Detail" data={null} fields={cargoFields[type]} />}
            {hasQuantity && (
                <DataSection
                    title={type === 'Commercial Invoice' ? 'Total Quantity' : 'Quantity'}
                    data={quantity}
                    fields={type === 'Commercial Invoice' ? invoiceQuantityFields : quantityFields}
                />
            )}
            {type === 'Insurance' && (
                <DataSection title="Insurance" data={data.insurance} fields={withSavedFields(
                    [['amountInsured', 'Amount Insured']], data.insurance,
                    [['coverageType', 'Coverage Type'], ['currency', 'Currency']],
                )} />
            )}
        </div>
    );
}
