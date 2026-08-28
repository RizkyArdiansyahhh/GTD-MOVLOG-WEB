import type { KelolaAkunUser } from '../types';
import UserTableRow from './UserTableRow';
import EmptyState from './EmptyState';

interface UserTableProps {
    users: KelolaAkunUser[];
    onStatusToggleClick: (user: KelolaAkunUser) => void;
    onEditClick?: (user: KelolaAkunUser) => void;
    onDeleteClick?: (user: KelolaAkunUser) => void;
    updatingUserId?: string | null;
}

export default function UserTable({
    users,
    onStatusToggleClick,
    onEditClick,
    onDeleteClick,
    updatingUserId,
}: UserTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Pengguna
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Role
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Email
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState />
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <UserTableRow
                                    key={user.id}
                                    user={user}
                                    onStatusToggleClick={onStatusToggleClick}
                                    onEditClick={onEditClick}
                                    onDeleteClick={onDeleteClick}
                                    isUpdatingStatus={updatingUserId === user.id}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
