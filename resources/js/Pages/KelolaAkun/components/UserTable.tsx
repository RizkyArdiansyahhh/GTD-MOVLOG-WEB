import type { KelolaAkunUser } from '../types';
import UserTableRow from './UserTableRow';
import EmptyState from './EmptyState';

interface UserTableProps {
    users: KelolaAkunUser[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onStatusToggleClick: (user: KelolaAkunUser) => void;
    updatingUserId?: string | null;
}

export default function UserTable({
    users,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onStatusToggleClick,
    updatingUserId,
}: UserTableProps) {
    const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                            <th className="px-4 py-3 w-12">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={onToggleSelectAll}
                                    className="rounded border-gray-300 cursor-pointer"
                                    style={{ width: 16, height: 16, accentColor: '#F5B800' }}
                                />
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Pengguna
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <EmptyState />
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <UserTableRow
                                    key={user.id}
                                    user={user}
                                    selected={selectedIds.has(user.id)}
                                    onToggleSelect={onToggleSelect}
                                    onStatusToggleClick={onStatusToggleClick}
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
