import type { KelolaAkunUser } from '../types';
import UserRoleBadge from './UserRoleBadge';
import UserStatusToggle from './UserStatusToggle';
import UserActionButtons from './UserActionButtons';

interface UserTableRowProps {
    user: KelolaAkunUser;
    onStatusToggleClick: (user: KelolaAkunUser) => void;
    onEditClick?: (user: KelolaAkunUser) => void;
    onDeleteClick?: (user: KelolaAkunUser) => void;
    isUpdatingStatus?: boolean;
}

export default function UserTableRow({
    user,
    onStatusToggleClick,
    onEditClick,
    onDeleteClick,
    isUpdatingStatus = false,
}: UserTableRowProps) {
    return (
        <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors duration-100">
            {/* Pengguna (Avatar + Nama + Email) */}
            <td className="px-6 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="rounded-full object-cover shrink-0"
                        style={{ width: 36, height: 36 }}
                    />
                    <div className="min-w-0">
                        <p
                            className="text-sm font-semibold truncate"
                            style={{ color: '#06283A' }}
                        >
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
            </td>

            {/* Role */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <UserRoleBadge role={user.role} />
            </td>

            {/* Email */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-sm text-gray-500">{user.email}</span>
            </td>

            {/* Status (Toggle Switch) */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <UserStatusToggle
                    status={user.status}
                    onToggle={() => onStatusToggleClick(user)}
                    disabled={isUpdatingStatus}
                />
            </td>

            {/* Aksi */}
            <td className="px-6 py-3.5 whitespace-nowrap">
                <UserActionButtons
                    userId={user.id}
                    onEdit={onEditClick ? () => onEditClick(user) : undefined}
                    onDelete={() => onDeleteClick?.(user)}
                />
            </td>
        </tr>
    );
}
