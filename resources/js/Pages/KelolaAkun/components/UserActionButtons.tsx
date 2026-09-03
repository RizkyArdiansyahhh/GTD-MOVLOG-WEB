import { Pencil, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface UserActionButtonsProps {
    userId: string;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function UserActionButtons({
    userId,
    onEdit,
    onDelete,
}: UserActionButtonsProps) {
    const handleEdit = () => {
        if (onEdit) {
            onEdit(userId);
        } else {
            router.get(`/users/${userId}/edit`);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {/* Edit */}
            <button
                type="button"
                onClick={handleEdit}
                className="flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-amber-50 cursor-pointer"
                style={{ width: 32, height: 32 }}
                title="Edit"
                aria-label="Edit user"
            >
                <Pencil size={16} className="text-gray-400 hover:text-amber-600" strokeWidth={1.8} />
            </button>

            {/* Hapus */}
            <button
                type="button"
                onClick={() => onDelete?.(userId)}
                className="flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-red-50 cursor-pointer"
                style={{ width: 32, height: 32 }}
                title="Delete"
                aria-label="Delete user"
            >
                <Trash2 size={16} className="text-gray-400 hover:text-red-600" strokeWidth={1.8} />
            </button>
        </div>
    );
}
