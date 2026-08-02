import type { VerificationDocument } from '../types';
import { FileText } from 'lucide-react';
import InsurancePreview from '../documents/InsurancePreview';
import BillOfLadingPreview from '../documents/BillOfLadingPreview';
import CommercialInvoicePreview from '../documents/CommercialInvoicePreview';
import PackingListPreview from '../documents/PackingListPreview';
import CertificateOfOriginPreview from '../documents/CertificateOfOriginPreview';

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

    const typeKey = document.documentType.toLowerCase();

    return (
        <div className="w-full flex flex-col justify-start bg-gray-100/70 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-[500px] md:max-h-[560px] shadow-inner">
            {(() => {
                if (typeKey.includes('insurance')) {
                    return <InsurancePreview document={document} />;
                }
                if (typeKey.includes('bill of lading') || typeKey.includes('bill-of-lading')) {
                    return <BillOfLadingPreview document={document} />;
                }
                if (typeKey.includes('commercial invoice') || typeKey.includes('commercial-invoice')) {
                    return <CommercialInvoicePreview document={document} />;
                }
                if (typeKey.includes('packing list') || typeKey.includes('packing-list')) {
                    return <PackingListPreview document={document} />;
                }
                if (typeKey.includes('certificate of origin') || typeKey.includes('coo')) {
                    return <CertificateOfOriginPreview document={document} />;
                }
                return <BillOfLadingPreview document={document} />;
            })()}
        </div>
    );
}
