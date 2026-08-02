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
                border: 'border-amber-200/80',
                dot: 'bg-amber-500',
                icon: AlertCircle,
            };
        case 'Approved':
            return {
                label: 'Approved',
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-200/80',
                dot: 'bg-emerald-500',
                icon: CheckCircle2,
            };
        case 'Rejected':
            return {
                label: 'Rejected',
                bg: 'bg-rose-50',
                text: 'text-rose-700',
                border: 'border-rose-200/80',
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
                'group relative rounded-[12px] transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]',
                isSelected
                    ? 'bg-[#FFF9E8] border-2 border-[#F5B800] shadow-[0_4px_14px_rgba(6,40,58,0.08)] p-[15px]'
                    : 'bg-white border border-[#E2E8F0] shadow-[0_2px_8px_rgba(6,40,58,0.05)] hover:border-[#F5B800] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(6,40,58,0.08)] p-4',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                {/* ── Left: 40x40 Icon + Main details ── */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* 40x40 Document Icon Container with background #FFF8E6 */}
                    <div
                        className="w-10 h-10 shrink-0 rounded-lg bg-[#FFF8E6] text-[#B45309] flex items-center justify-center border border-[#F5B800]/20 transition-transform duration-150 group-hover:scale-105"
                    >
                        <IconComponent size={20} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                        {/* Document Number (Font Semibold) */}
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#06283A] leading-tight truncate">
                                {document.documentNumber}
                            </h4>
                        </div>

                        {/* Document Type (Text Secondary) */}
                        <p className="text-xs text-slate-500 font-normal mt-0.5 leading-normal truncate">
                            {document.documentType}
                        </p>

                        {/* Metadata: Uploader & Timestamp */}
                        <div className="flex items-center gap-3.5 mt-2.5 text-xs text-slate-400 font-normal flex-wrap">
                            <span className="flex items-center gap-1.5 min-w-0">
                                <User size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[130px]" title={document.uploadedBy}>
                                    {document.uploadedBy}
                                </span>
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                                <Clock size={13} className="text-slate-400 shrink-0" />
                                <span>{document.timeAgo}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Status badge at top right ── */}
                <div className="shrink-0 flex items-center pt-0.5">
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
