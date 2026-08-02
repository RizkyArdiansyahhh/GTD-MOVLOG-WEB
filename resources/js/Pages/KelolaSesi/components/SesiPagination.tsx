import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SesiPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function SesiPagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: SesiPaginationProps) {
    if (totalPages <= 1) {
        return (
            <div className="flex justify-between items-center pt-4 text-xs text-slate-500">
                <span>Menampilkan {totalItems} dari {totalItems} sesi</span>
            </div>
        );
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            {/* Left label */}
            <span className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-semibold text-slate-800">{startItem}-{endItem}</span> dari{' '}
                <span className="font-semibold text-slate-800">{totalItems}</span> sesi
            </span>

            {/* Right pagination controls */}
            <div className="flex items-center gap-1">
                {/* Prev button */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 rounded border border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman sebelumnya"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {pages.map((p) => {
                    const isActive = p === currentPage;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className="flex items-center justify-center w-8 h-8 rounded border text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: isActive ? '#F5B800' : '#FFFFFF',
                                color: isActive ? '#06283A' : '#475569',
                                borderColor: isActive ? '#F5B800' : '#E2E8F0',
                            }}
                        >
                            {p}
                        </button>
                    );
                })}

                {/* Next button */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 rounded border border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman selanjutnya"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
