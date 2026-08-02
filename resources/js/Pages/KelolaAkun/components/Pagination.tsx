import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate visible page numbers
    const getPageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
            {/* Info */}
            <p className="text-sm text-gray-400 text-center sm:text-left">
                Menampilkan <span className="font-semibold text-gray-600">{from}–{to}</span> dari{' '}
                <span className="font-semibold text-gray-600">{totalItems}</span> pengguna
            </p>

            {/* Page Controls */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1">
                {/* Sebelumnya */}
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="flex items-center gap-1 rounded-lg px-3 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-600"
                    style={{ height: 36 }}
                >
                    <ChevronLeft size={16} strokeWidth={2} />
                    Sebelumnya
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="flex items-center justify-center text-sm text-gray-400"
                            style={{ width: 36, height: 36 }}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={[
                                'flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150',
                                currentPage === page
                                    ? 'text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100',
                            ].join(' ')}
                            style={{
                                width: 36,
                                height: 36,
                                backgroundColor: currentPage === page ? '#F5B800' : undefined,
                            }}
                        >
                            {page}
                        </button>
                    ),
                )}

                {/* Berikutnya */}
                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="flex items-center gap-1 rounded-lg px-3 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-600"
                    style={{ height: 36 }}
                >
                    Berikutnya
                    <ChevronRight size={16} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}
