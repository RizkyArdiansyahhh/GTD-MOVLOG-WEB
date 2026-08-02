import type { VerificationDocument } from '../types';

interface DocumentMetadataProps {
    document: VerificationDocument | null;
}

export default function DocumentMetadata({ document }: DocumentMetadataProps) {
    if (!document) return null;

    const getStatusStyle = (status: VerificationDocument['status']) => {
        switch (status) {
            case 'Approved':
                return 'text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block';
            case 'Rejected':
                return 'text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block';
            default:
                return 'text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-100 pb-2">
                Metadata Dokumen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[12px] font-medium" style={{ color: '#64748B' }}>
                {/* Column 1 */}
                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Diunggah Oleh</span>
                    <span className="text-gray-900 font-semibold">{document.uploadedBy}</span>
                </div>

                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Tanggal Unggah</span>
                    <span className="text-gray-900 font-semibold">{document.uploadDate}</span>
                </div>

                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Tipe Dokumen</span>
                    <span className="text-gray-900 font-semibold">{document.documentType}</span>
                </div>

                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Status Verifikasi</span>
                    <span className={getStatusStyle(document.status)}>{document.status}</span>
                </div>

                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Referensi Pengiriman</span>
                    <span className="text-amber-700 font-mono font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 inline-block">
                        {document.shipmentReference}
                    </span>
                </div>

                <div>
                    <span className="block text-gray-400 text-[11px] font-normal mb-0.5">Catatan Verifikator</span>
                    <span className="text-gray-700 italic font-normal">
                        {document.notes || 'Belum ada catatan.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
