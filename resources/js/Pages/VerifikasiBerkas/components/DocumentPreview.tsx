import { useState } from 'react';
import type { VerificationDocument } from '../types';
import { FileText, ExternalLink, AlertTriangle } from 'lucide-react';

interface DocumentPreviewProps {
    document: VerificationDocument | null;
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
    const [hasError, setHasError] = useState(false);

    if (!document) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center min-h-[360px]">
                <div
                    className="flex items-center justify-center rounded-full mb-3 bg-gray-100 text-gray-400"
                    style={{ width: 56, height: 56 }}
                >
                    <FileText size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">No document selected</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Select a document from the list on the left to preview and verify.
                </p>
            </div>
        );
    }

    const previewUrl = document.previewUrl || document.fileUrl || `/verifikasi-berkas/file/${document.id}`;

    if (hasError || !previewUrl) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-amber-50/40 rounded-xl border border-dashed border-amber-200 text-center min-h-[360px]">
                <div
                    className="flex items-center justify-center rounded-full mb-3 bg-amber-100 text-amber-600"
                    style={{ width: 52, height: 52 }}
                >
                    <AlertTriangle size={26} strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Document preview unavailable</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    The uploaded file could not be previewed directly in the browser.
                </p>
                {previewUrl && (
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all"
                    >
                        <ExternalLink size={13} />
                        <span>Open / Download PDF</span>
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-white rounded-lg border border-slate-200/80 text-xs">
                <span className="text-slate-600 font-medium truncate max-w-[240px]" title={document.fileName || document.title}>
                    {document.fileName || document.title}
                </span>
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                    <ExternalLink size={12} />
                    <span>Open in new tab</span>
                </a>
            </div>

            <div className="relative w-full rounded-lg overflow-hidden bg-white border border-slate-200" style={{ height: 480 }}>
                <iframe
                    key={document.id}
                    src={previewUrl}
                    title={document.title || 'Document PDF Preview'}
                    className="w-full h-full border-0"
                    onError={() => setHasError(true)}
                />
            </div>
        </div>
    );
}
