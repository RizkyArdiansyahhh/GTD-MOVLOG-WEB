import type { VerificationDocument } from '../types';
import { Receipt } from 'lucide-react';

interface CommercialInvoicePreviewProps {
    document: VerificationDocument;
}

export default function CommercialInvoicePreview({ document }: CommercialInvoicePreviewProps) {
    const shipper = document.shipper || {
        name: 'SHANGHAI LOGISTICS GLOBAL CO., LTD.',
        address: 'No. 888 Century Avenue, Pudong New Area, Shanghai, China',
        taxId: '91310000MA1FL4598X',
    };

    const consignee = document.consignee || {
        name: 'PT GLOBAL TRANS DJAYA',
        address: 'Jl. Boulevard Barat Raya No. 12, Kelapa Gading, Jakarta Utara',
        taxId: '01.234.567.8-012.000',
    };

    const transport = document.transportDetail || {
        portOfLoading: 'Port of Shanghai, China (CNSHA)',
        portOfDischarge: 'Tanjung Priok, Jakarta (IDTPP)',
        shipName: 'MV OCEAN STAR',
        voyage: 'VOY-2026-088E',
    };

    const cargoList = document.cargoDetails && document.cargoDetails.length > 0
        ? document.cargoDetails
        : [
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
            },
        ];

    const termOfShipment = document.termOfShipment || 'FOB';
    const totals = document.totals || {
        totalPackages: '39 Packages',
        totalGoods: '180 Items',
        totalPrice: 'USD 103,200.00',
    };

    return (
        <div className="relative bg-white p-6 sm:p-7 rounded-lg border border-gray-200 shadow-sm text-gray-800 text-[11px] font-sans">
            {/* Watermark Stamp */}
            {document.status === 'Approved' && (
                <div className="absolute right-6 top-24 pointer-events-none transform rotate-[-12deg] opacity-25 border-4 border-emerald-600 rounded-xl px-4 py-2 text-center text-emerald-700 font-extrabold tracking-widest text-base uppercase">
                    VERIFIED / APPROVED
                </div>
            )}
            {document.status === 'Rejected' && (
                <div className="absolute right-6 top-24 pointer-events-none transform rotate-[-12deg] opacity-25 border-4 border-red-600 rounded-xl px-4 py-2 text-center text-red-700 font-extrabold tracking-widest text-base uppercase">
                    REJECTED
                </div>
            )}
            {document.status === 'Pending' && (
                <div className="absolute right-6 top-24 pointer-events-none transform rotate-[-12deg] opacity-20 border-4 border-amber-500 rounded-xl px-4 py-2 text-center text-amber-600 font-extrabold tracking-widest text-base uppercase">
                    PENDING VERIFICATION
                </div>
            )}

            {/* Header section */}
            <div className="flex items-start justify-between border-b-2 border-[#06283A] pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center rounded-lg bg-[#06283A] text-[#F5B800] w-9 h-9">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[#06283A] tracking-tight">
                            GTD LOGISTICS OS
                        </h2>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                            Commercial Trade Invoice
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#06283A] block">
                        COMMERCIAL INVOICE
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                        {document.documentNumber}
                    </span>
                </div>
            </div>

            {/* 1. Document Detail */}
            <div className="mb-4 bg-gray-50 p-2.5 rounded border border-gray-200 text-[10px]">
                <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b pb-1 mb-1.5 text-[10px]">
                    1. Document Detail
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                        <span className="text-gray-500 block">a. Number:</span>
                        <strong className="font-mono text-gray-900">{document.documentNumber}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">b. Date:</span>
                        <strong className="text-gray-900">{document.uploadDate.split(' ')[0]}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">c. Shipment Contract Number:</span>
                        <strong className="font-mono text-gray-900">{document.contractNumber || 'CTR-GTD-2026-004'}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">d. Term of Shipment:</span>
                        <span className="inline-block bg-[#06283A] text-white px-2 py-0.5 rounded text-[9px] font-bold">
                            {termOfShipment}
                        </span>
                        {termOfShipment === 'FOB' && (
                            <div className="text-[9px] text-gray-600 mt-1">
                                <div>1. Ocean Freight: <span className="font-mono font-semibold">{document.oceanFreight || 'USD 2,450.00'}</span></div>
                                <div>2. Insurance: <span className="font-mono font-semibold">{document.insuranceFee || 'USD 350.00'}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipper & Consignee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* 2. Shipper */}
                <div className="border border-gray-200 rounded p-2.5 bg-white">
                    <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b pb-1 mb-1.5 text-[10px]">
                        2. Shipper
                    </h4>
                    <p className="font-semibold text-gray-900">{shipper.name}</p>
                    <p className="text-gray-600 leading-snug mt-0.5">{shipper.address}</p>
                    <p className="mt-1 font-mono text-[10px] text-gray-700">
                        <span className="text-gray-500 font-sans">Tax ID:</span> {shipper.taxId}
                    </p>
                </div>

                {/* 3. Consignee */}
                <div className="border border-gray-200 rounded p-2.5 bg-white">
                    <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b pb-1 mb-1.5 text-[10px]">
                        3. Consignee
                    </h4>
                    <p className="font-semibold text-gray-900">{consignee.name}</p>
                    <p className="text-gray-600 leading-snug mt-0.5">{consignee.address}</p>
                    <p className="mt-1 font-mono text-[10px] text-gray-700">
                        <span className="text-gray-500 font-sans">Tax ID:</span> {consignee.taxId}
                    </p>
                </div>
            </div>

            {/* 4. Transport Detail */}
            <div className="border border-gray-200 rounded p-2.5 bg-gray-50 mb-4">
                <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b pb-1 mb-2 text-[10px]">
                    4. Transport Detail
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                        <span className="text-gray-500 block">a. Port of Loading:</span>
                        <strong className="text-gray-900">{transport.portOfLoading}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">b. Port of Discharge:</span>
                        <strong className="text-gray-900">{transport.portOfDischarge}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">c. Ship Name:</span>
                        <strong className="text-gray-900">{transport.shipName}</strong>
                    </div>
                    <div>
                        <span className="text-gray-500 block">d. Voyage:</span>
                        <strong className="text-gray-900 font-mono">{transport.voyage}</strong>
                    </div>
                </div>
            </div>

            {/* 5. Cargo Detail (List) */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-[#06283A] uppercase tracking-wide text-[10px]">
                        5. Cargo Detail (List)
                    </h4>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium border border-amber-200">
                        Currency: {cargoList[0]?.currency || 'USD ($)'}
                    </span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="w-full text-left border-collapse text-[9.5px]">
                        <thead>
                            <tr className="bg-[#06283A] text-white font-semibold whitespace-nowrap">
                                <th className="py-1.5 px-2">Desc Goods</th>
                                <th className="py-1.5 px-2 text-center">Qty Goods</th>
                                <th className="py-1.5 px-2 text-center">Goods Unit</th>
                                <th className="py-1.5 px-2 text-center">Qty Pkg</th>
                                <th className="py-1.5 px-2 text-center">Pkg Unit</th>
                                <th className="py-1.5 px-2 text-right">Unit Price</th>
                                <th className="py-1.5 px-2">Type / Brand</th>
                                <th className="py-1.5 px-2 text-right">HS POL / POD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {cargoList.map((item, idx) => (
                                <tr key={idx} className="bg-white">
                                    <td className="py-1.5 px-2 font-medium text-gray-900">{item.description}</td>
                                    <td className="py-1.5 px-2 text-center font-mono">{item.quantityGoods || '-'}</td>
                                    <td className="py-1.5 px-2 text-center text-gray-600">{item.goodsUnit || '-'}</td>
                                    <td className="py-1.5 px-2 text-center font-mono">{item.quantityPackage || '-'}</td>
                                    <td className="py-1.5 px-2 text-center text-gray-600">{item.packageUnit || '-'}</td>
                                    <td className="py-1.5 px-2 text-right font-mono font-semibold text-gray-900">
                                        {item.price ? `${item.currency?.split(' ')[0] || '$'} ${item.price.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-gray-700">
                                        {item.type} {item.brand ? `(${item.brand})` : ''}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono text-[9px] text-gray-600">
                                        POL: {item.hsCodePOL || '-'}<br />
                                        POD: {item.hsCodePOD || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. Total Quantity */}
            <div className="border border-gray-200 rounded p-2.5 bg-gray-50 mb-4">
                <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b border-gray-200 pb-1 mb-2 text-[10px]">
                    6. Total Quantity & Grand Total
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                    <div className="bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-gray-500 block text-[9px]">a. Total of Packages</span>
                        <strong className="text-gray-900 font-mono">{totals.totalPackages || '-'}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-gray-500 block text-[9px]">b. Total of Goods</span>
                        <strong className="text-gray-900 font-mono">{totals.totalGoods || '-'}</strong>
                    </div>
                    <div className="bg-[#06283A] text-white p-1.5 rounded border border-[#06283A]">
                        <span className="text-amber-400 block text-[9px] font-semibold">c. Total Price / Amount</span>
                        <strong className="text-[#F5B800] font-mono text-xs">{totals.totalPrice || '-'}</strong>
                    </div>
                </div>
            </div>

            {/* Footers */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500">
                <span>GTD Logistics OS — Verified Commercial Invoice</span>
                <span>Page 1 of 1</span>
            </div>
        </div>
    );
}
