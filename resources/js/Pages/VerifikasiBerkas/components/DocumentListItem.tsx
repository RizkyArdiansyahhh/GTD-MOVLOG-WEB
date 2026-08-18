import {
    ShieldCheck,
    FileText,
    Package,
    Receipt,
    Anchor,
    Clock,
    User,
} from 'lucide-react';
import type { VerificationDocument, SupportedDocumentType } from '../types';

interface DocumentListItemProps {
    document: VerificationDocument;
    isSelected: boolean;
    onSelect: (document: VerificationDocument) => void;
}

/** Get appropriate Lucide icon for supported document type */
const getDocumentIcon = (type: SupportedDocumentType) => {
    switch (type) {
        case 'Insurance':
            return ShieldCheck;
        case 'Certificate of Origin (COO)':
            return FileText;
        case 'Packing List':
            return Package;
        case 'Commercial Invoice':
            return Receipt;
        case 'Bill of Lading':
            return Anchor;
        default:
            return FileText;
    }
};

export default function DocumentListItem({
    document,
    isSelected,
    onSelect,
}: DocumentListItemProps) {
    const IconComponent = getDocumentIcon(document.documentType);

    // Status plain text styling (no pill, no solid background)
    let statusText = 'Pending';
    let statusColorClass = 'text-slate-400 font-normal';

    if (document.status === 'Approved') {
        statusText = 'Approved';
        statusColorClass = 'text-emerald-600 font-medium';
    } else if (document.status === 'Rejected') {
        statusText = 'Ditolak';
        statusColorClass = 'text-rose-600 font-medium';
    }

    return (
        <div
            onClick={() => onSelect(document)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(document);
                }
            }}
            className={[
                'group relative rounded-[10px] p-3.5 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all duration-150 ease-in-out',
                isSelected
                    ? 'bg-slate-100 border border-slate-300 shadow-sm'
                    : 'bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(6,40,58,0.03)] hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(6,40,58,0.05)]',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                {/* ── Left: Outline icon (no box container) + Details ── */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <IconComponent
                        size={19}
                        strokeWidth={1.8}
                        className={[
                            'shrink-0 mt-0.5 transition-colors',
                            isSelected ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600',
                        ].join(' ')}
                    />

                    <div className="min-w-0 flex-1">
                        {/* Document Number */}
                        <h4
                            className={[
                                'text-sm text-[#06283A] leading-tight truncate transition-all',
                                isSelected ? 'font-semibold' : 'font-medium',
                            ].join(' ')}
                        >
                            {document.documentNumber}
                        </h4>

                        {/* Document Type */}
                        <p className="text-xs text-slate-500 font-normal mt-0.5 leading-normal truncate">
                            {document.documentType}
                        </p>

                        {/* Metadata: Uploader & Timestamp */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-normal flex-wrap">
                            <span className="flex items-center gap-1.5 min-w-0">
                                <User size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[130px]" title={document.uploadedBy}>
                                    {document.uploadedBy}
                                </span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                                <Clock size={12} className="text-slate-400 shrink-0" />
                                <span>{document.timeAgo}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Plain colored status text (no pill, no border) ── */}
                <div className="shrink-0 pt-0.5">
                    <span className={`text-xs ${statusColorClass}`}>
                        {statusText}
                    </span>
                </div>
            </div>
        </div>
    );
}
