import type { VerificationDocument } from '../types';
import { ShieldCheck } from 'lucide-react';

interface InsurancePreviewProps {
    document: VerificationDocument;
}

export default function InsurancePreview({ document }: InsurancePreviewProps) {
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
                description: 'Precision Medical Imaging Equipment & Accessories',
                hsCodePOL: '9018.90.90',
            },
        ];

    const totals = document.totals || {
        totalGrossWeight: '2,800.00 KGS',
        totalPackages: '12 CARTONS',
        totalVolume: '9.40 CBM',
    };

    const relatedDocs = document.relatedDocumentNumbers || {
        commercialInvoiceNumber: 'INV-2026-017',
        billOfLadingNumber: 'BOL-2026-017',
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
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[#06283A] tracking-tight">
                            GTD LOGISTICS OS
                        </h2>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                            Marine Cargo Protection Policy
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#06283A] block">
                        INSURANCE POLICY
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                        {document.documentNumber}
                    </span>
                </div>
            </div>

            {/* Policy Reference Header */}
            <div className="mb-4 bg-[#06283A]/5 border border-[#06283A]/20 p-3 rounded text-[10px] grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* 1. Commercial Invoice Number */}
                <div>
                    <span className="text-gray-500 block">1. Commercial Invoice Number:</span>
                    <strong className="font-mono text-gray-900">{relatedDocs.commercialInvoiceNumber || 'INV-2026-017'}</strong>
                </div>

                {/* 2. Bill of Lading Number */}
                <div>
                    <span className="text-gray-500 block">2. Bill of Lading Number:</span>
                    <strong className="font-mono text-gray-900">{relatedDocs.billOfLadingNumber || 'BOL-2026-017'}</strong>
                </div>

                {/* 3. Shipment Contract Number */}
                <div>
                    <span className="text-gray-500 block">3. Shipment Contract Number:</span>
                    <strong className="font-mono text-gray-900">{document.contractNumber || 'CTR-GTD-2026-015'}</strong>
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
                <h4 className="font-bold text-[#06283A] uppercase tracking-wide mb-1 text-[10px]">
                    5. Cargo Detail (List)
                </h4>
                <div className="overflow-hidden border border-gray-200 rounded">
                    <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-[#06283A] text-white font-semibold">
                                <th className="py-1.5 px-2.5">No</th>
                                <th className="py-1.5 px-2.5">a. Description of Goods</th>
                                <th className="py-1.5 px-2.5 text-right">b. HS Code POL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {cargoList.map((item, index) => (
                                <tr key={index} className="bg-white">
                                    <td className="py-1.5 px-2.5 font-mono">{index + 1}</td>
                                    <td className="py-1.5 px-2.5 font-medium text-gray-900">{item.description}</td>
                                    <td className="py-1.5 px-2.5 text-right font-mono text-gray-700">{item.hsCodePOL || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. Quantity */}
            <div className="border border-gray-200 rounded p-2.5 bg-gray-50 mb-4">
                <h4 className="font-bold text-[#06283A] uppercase tracking-wide border-b border-gray-200 pb-1 mb-2 text-[10px]">
                    6. Quantity Summary
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                    <div className="bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-gray-500 block text-[9px]">a. Total of Gross Weight</span>
                        <strong className="text-gray-900 font-mono">{totals.totalGrossWeight || '-'}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-gray-500 block text-[9px]">b. Total of Packages</span>
                        <strong className="text-gray-900 font-mono">{totals.totalPackages || '-'}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-gray-500 block text-[9px]">c. Total Volume</span>
                        <strong className="text-gray-900 font-mono">{totals.totalVolume || '-'}</strong>
                    </div>
                </div>
            </div>

            {/* 7. Amount Insured */}
            <div className="border-2 border-[#06283A] rounded-lg p-3 bg-gradient-to-r from-[#06283A]/5 to-[#F5B800]/10 mb-4 flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold text-[#06283A] uppercase block">
                        7. Amount Insured (Total Policy Coverage)
                    </span>
                    <span className="text-[9px] text-gray-500">All-Risk Cargo Coverage under Maritime Protocol</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-mono font-extrabold text-[#06283A]">
                        {document.amountInsured || 'USD 115,000.00'}
                    </span>
                </div>
            </div>

            {/* Footers */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500">
                <span>GTD Logistics OS — Verified Marine Insurance Certificate</span>
                <span>Page 1 of 1</span>
            </div>
        </div>
    );
}
