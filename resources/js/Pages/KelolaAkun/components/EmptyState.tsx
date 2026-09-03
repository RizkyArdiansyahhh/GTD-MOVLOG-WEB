import { SearchIcon } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export default function EmptyState({
    title = 'Tidak ada data ditemukan',
    description = 'Try changing search keywords or active filters.',
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
                className="flex items-center justify-center rounded-full mb-4"
                style={{ width: 56, height: 56, backgroundColor: '#F5B80018' }}
            >
                <SearchIcon size={24} style={{ color: '#F5B800' }} strokeWidth={1.8} />
            </div>
            <p
                className="text-sm font-semibold mb-1"
                style={{ color: '#06283A' }}
            >
                {title}
            </p>
            <p className="text-xs text-gray-400 max-w-xs">{description}</p>
        </div>
    );
}
