import type { VerificationDocument } from '../types';
import { FileText, ShieldCheck, Package, Receipt, Anchor } from 'lucide-react';

interface DocumentPreviewProps {
    document: VerificationDocument | null;
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
    if (!document) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center min-h-[360px]">
                <div
                    className="flex items-center justify-center rounded-full mb-3 bg-gray-100 text-gray-400"
                    style={{ width: 56, height: 56 }}
                >
                    <FileText size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Tidak ada dokumen dipilih</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Pilih salah satu dokumen dari daftar sebelah kiri untuk menampilkan pratinjau dan verifikasi berkas.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-start bg-gray-100/70 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-[460px] md:max-h-[520px] shadow-inner">
            {/* ── A4 Page Sheet ── */}
            <div
                className="w-full max-w-[560px] bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-200/80 relative flex flex-col justify-between text-gray-800 transition-all duration-200 select-none"
                style={{
                    aspectRatio: '210 / 297', // A4 aspect ratio (1 : 1.414)
                }}
            >
                {/* ── Document Watermark Stamp based on Status ── */}
                {document.status === 'Approved' && (
                    <div className="absolute right-6 top-24 pointer-events-none transform rotate-[-12deg] opacity-25 border-4 border-emerald-600 rounded-xl px-4 py-2 text-center text-emerald-700 font-extrabold tracking-widest text-lg uppercase">
                        VERIFIED / APPROVED
                    </div>
                )}
                {document.status === 'Rejected' && (
                    <div className="absolute right-6 top-24 pointer-events-none transform rotate-[-12deg] opacity-25 border-4 border-red-600 rounded-xl px-4 py-2 text-center text-red-700 font-extrabold tracking-widest text-lg uppercase">
                        REJECTED
                    </div>
                )}

                {/* ── Header Area ── */}
                <div>
                    <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-5">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex items-center justify-center rounded-lg bg-[#06283A] text-[#F5B800]"
                                style={{ width: 34, height: 34 }}
                            >
                                {document.documentType === 'Insurance' && <ShieldCheck size={20} />}
                                {document.documentType === 'Certificate of Origin (COO)' && <FileText size={20} />}
                                {document.documentType === 'Packing List' && <Package size={20} />}
                                {document.documentType === 'Commercial Invoice' && <Receipt size={20} />}
                                {document.documentType === 'Bill of Lading' && <Anchor size={20} />}
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[#06283A] leading-none tracking-tight">
                                    GTD LOGISTICS OS
                                </h2>
                                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">
                                    Global Trans Djaya Management System
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                                OFFICAL DOCUMENT
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-900">
                                {document.documentNumber}
                            </span>
                        </div>
                    </div>

                    {/* Document Title Header */}
                    <div className="text-center my-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <h1 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
                            {document.documentType}
                        </h1>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Ref Shipment: {document.shipmentReference}
                        </p>
                    </div>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] mb-5 bg-white p-3 rounded border border-gray-100">
                        <div>
                            <span className="text-gray-400 block font-medium">Pengirim / Pengunggah:</span>
                            <strong className="text-gray-800">{document.uploadedBy}</strong>
                        </div>
                        <div>
                            <span className="text-gray-400 block font-medium">Tanggal Diterbitkan:</span>
                            <strong className="text-gray-800">{document.uploadDate}</strong>
                        </div>
                    </div>

                    {/* Realistic Table Content preview depending on Document Type */}
                    <div className="overflow-hidden border border-gray-200 rounded text-[11px] mb-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                                    <th className="py-1.5 px-2.5">No</th>
                                    <th className="py-1.5 px-2.5">Deskripsi Items / Cargo</th>
                                    <th className="py-1.5 px-2.5 text-center">Jumlah</th>
                                    <th className="py-1.5 px-2.5 text-right">Status Kargo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-600">
                                <tr>
                                    <td className="py-1.5 px-2.5 font-mono">01</td>
                                    <td className="py-1.5 px-2.5 font-medium text-gray-800">
                                        Container Containerized Freight - Logistics Batch #819
                                    </td>
                                    <td className="py-1.5 px-2.5 text-center">120 Koli</td>
                                    <td className="py-1.5 px-2.5 text-right text-emerald-600 font-semibold">Tervalidasi</td>
                                </tr>
                                <tr>
                                    <td className="py-1.5 px-2.5 font-mono">02</td>
                                    <td className="py-1.5 px-2.5 font-medium text-gray-800">
                                        Pallet Sparepart Auto Heavy Machinery
                                    </td>
                                    <td className="py-1.5 px-2.5 text-center">45 Units</td>
                                    <td className="py-1.5 px-2.5 text-right text-emerald-600 font-semibold">Tervalidasi</td>
                                </tr>
                                <tr>
                                    <td className="py-1.5 px-2.5 font-mono">03</td>
                                    <td className="py-1.5 px-2.5 font-medium text-gray-800">
                                        Assorted Commercial Goods Sealed Standard
                                    </td>
                                    <td className="py-1.5 px-2.5 text-center">1 Box Container</td>
                                    <td className="py-1.5 px-2.5 text-right text-emerald-600 font-semibold">Tervalidasi</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Document Specific Notes */}
                    {document.notes && (
                        <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200/60 text-[11px] text-amber-900 mb-4">
                            <span className="font-semibold block mb-0.5 text-amber-950">Catatan Khusus:</span>
                            <p className="leading-snug text-amber-800">{document.notes}</p>
                        </div>
                    )}
                </div>

                {/* ── Footer Signature Area ── */}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-center text-[10px] text-gray-500">
                    <div>
                        <p className="font-medium text-gray-700">Diverifikasi Oleh:</p>
                        <div className="h-10 my-1 flex items-center justify-center">
                            <span className="italic text-gray-400 font-serif">[ Signature Tanda Tangan ]</span>
                        </div>
                        <p className="font-bold text-gray-900">Supervisor Operasional</p>
                        <p className="text-[9px]">GTD Logistics Management System</p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-700">Stempel Resmi System:</p>
                        <div className="h-10 my-1 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#06283A] flex items-center justify-center text-[8px] font-bold text-[#06283A]">
                                GTD
                            </div>
                        </div>
                        <p className="font-bold text-gray-900">GTD Logistics System</p>
                        <p className="text-[9px]">Automated Verification Protocol</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
