import type { VerificationDocument } from '../types';
import DocumentListItem from './DocumentListItem';
import { FileSearch } from 'lucide-react';

interface DocumentListProps {
    documents: VerificationDocument[];
    selectedDocument: VerificationDocument | null;
    onSelectDocument: (doc: VerificationDocument) => void;
}

export default function DocumentList({
    documents,
    selectedDocument,
    onSelectDocument,
}: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-auto h-full min-h-[260px]">
                <div
                    className="flex items-center justify-center rounded-full mb-3 bg-amber-100/60 text-amber-600"
                    style={{ width: 48, height: 48 }}
                >
                    <FileSearch size={24} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-semibold text-gray-800">Tidak ada dokumen</p>
                <p className="text-xs text-gray-500 mt-1">
                    Tidak ditemukan berkas yang sesuai dengan kriteria penyaringan saat ini.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
            {documents.map((doc) => (
                <DocumentListItem
                    key={doc.id}
                    document={doc}
                    isSelected={selectedDocument?.id === doc.id}
                    onSelect={onSelectDocument}
                />
            ))}
        </div>
    );
}
