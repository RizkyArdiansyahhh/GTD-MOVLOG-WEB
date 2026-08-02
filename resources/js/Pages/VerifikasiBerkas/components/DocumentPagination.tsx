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
    if (totalPages <= 1) {
        return (
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Total {totalItems} Berkas</span>
                <span>Halaman 1 dari 1</span>
            </div>
        );
    }

    return (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                Halaman <strong className="text-gray-800">{currentPage}</strong> dari{' '}
                <strong className="text-gray-800">{totalPages}</strong> ({totalItems} berkas)
            </span>

            <span className="text-xs text-gray-500 font-medium sm:hidden">
                {currentPage} / {totalPages}
            </span>

            <div className="flex items-center gap-1.5 ml-auto">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                </button>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                    <span>Selanjutnya</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
