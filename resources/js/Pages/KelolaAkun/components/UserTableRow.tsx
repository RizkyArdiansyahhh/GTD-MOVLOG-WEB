import type { KelolaAkunUser } from '../types';
import UserRoleBadge from './UserRoleBadge';
import UserStatusToggle from './UserStatusToggle';
import UserActionButtons from './UserActionButtons';

interface UserTableRowProps {
    user: KelolaAkunUser;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onStatusToggleClick: (user: KelolaAkunUser) => void;
    isUpdatingStatus?: boolean;
}

export default function UserTableRow({
    user,
    selected,
    onToggleSelect,
    onStatusToggleClick,
    isUpdatingStatus = false,
}: UserTableRowProps) {
    return (
        <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors duration-100">
            {/* Checkbox */}
            <td className="px-4 py-3.5">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(user.id)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
                    style={{ width: 16, height: 16, accentColor: '#F5B800' }}
                />
            </td>

            {/* Pengguna (Avatar + Nama + Email) */}
            <td className="px-4 py-3.5">
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
            <td className="px-4 py-3.5">
                <UserRoleBadge role={user.role} />
            </td>

            {/* Email */}
            <td className="px-4 py-3.5">
                <span className="text-sm text-gray-500">{user.email}</span>
            </td>

            {/* Status (Toggle Switch) */}
            <td className="px-4 py-3.5">
                <UserStatusToggle
                    status={user.status}
                    onToggle={() => onStatusToggleClick(user)}
                    disabled={isUpdatingStatus}
                />
            </td>

            {/* Aksi */}
            <td className="px-4 py-3.5">
                <UserActionButtons userId={user.id} />
            </td>
        </tr>
    );
}
