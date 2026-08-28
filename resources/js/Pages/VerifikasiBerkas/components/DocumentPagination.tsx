import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export default function DocumentPagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}: DocumentPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
                Showing page <strong className="text-slate-700">{currentPage}</strong> of{' '}
                <strong className="text-slate-700">{totalPages}</strong> ({totalItems} documents)
            </span>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous page"
                >
                    <ChevronLeft size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next page"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
