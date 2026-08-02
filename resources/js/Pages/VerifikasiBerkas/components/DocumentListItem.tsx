import {
    ShieldCheck,
    FileText,
    Package,
    Receipt,
    Anchor,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
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

/** Get status badge styling and text */
const getStatusBadge = (status: VerificationDocument['status']) => {
    switch (status) {
        case 'Pending':
            return {
                label: 'Pending',
                bg: 'bg-amber-50',
                text: 'text-amber-700',
                border: 'border-amber-200',
                dot: 'bg-amber-500',
                icon: AlertCircle,
            };
        case 'Approved':
            return {
                label: 'Approved',
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-200',
                dot: 'bg-emerald-500',
                icon: CheckCircle2,
            };
        case 'Rejected':
            return {
                label: 'Rejected',
                bg: 'bg-rose-50',
                text: 'text-rose-700',
                border: 'border-rose-200',
                dot: 'bg-rose-500',
                icon: XCircle,
            };
    }
};

export default function DocumentListItem({
    document,
    isSelected,
    onSelect,
}: DocumentListItemProps) {
    const IconComponent = getDocumentIcon(document.documentType);
    const badge = getStatusBadge(document.status);

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
                'group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                isSelected
                    ? 'bg-[#FFFBEB] border-amber-300 shadow-sm border-l-4 border-l-[#F5B800]'
                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                {/* ── Left: Icon + Main details ── */}
                <div className="flex items-start gap-3 min-w-0">
                    <div
                        className={[
                            'flex items-center justify-center shrink-0 rounded-xl transition-colors duration-150',
                            isSelected
                                ? 'bg-[#F5B800]/20 text-[#06283A]'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-amber-100 group-hover:text-amber-700',
                        ].join(' ')}
                        style={{ width: 42, height: 42 }}
                    >
                        <IconComponent size={20} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                        {/* Document Title */}
                        <h4 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                            {document.title}
                        </h4>

                        {/* Document Number & Type */}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                {document.documentNumber}
                            </span>
                            <span className="text-xs text-gray-500 font-normal">
                                • {document.documentType}
                            </span>
                        </div>

                        {/* Upload details: Uploaded by & time */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                                <User size={12} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[130px]" title={document.uploadedBy}>
                                    {document.uploadedBy}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} className="text-gray-400 shrink-0" />
                                <span>{document.timeAgo}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Status badge ── */}
                <div className="shrink-0 flex items-center">
                    <span
                        className={[
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                            badge.bg,
                            badge.text,
                            badge.border,
                        ].join(' ')}
                    >
                        <span className={['w-1.5 h-1.5 rounded-full', badge.dot].join(' ')} />
                        {badge.label}
                    </span>
                </div>
            </div>
        </div>
    );
}
