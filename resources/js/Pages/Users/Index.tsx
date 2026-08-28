import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedResponse, User } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

interface UsersIndexProps extends PageProps {
    users: PaginatedResponse<User>;
    filters: {
        search?: string;
        per_page?: number;
    };
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        banned: 'bg-red-500/10 text-red-400 border-red-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] ?? colors.inactive}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default function Index({ users, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/users', { search, per_page: filters.per_page }, { preserveState: true });
    };

    return (
        <AppLayout title="User Management">
            <Head title="Users" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">Users</h2>
                    <p className="text-slate-400 text-sm mt-0.5">{users.meta.total} total users</p>
                </div>
                <Link
                    href="/users/create"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-150 shadow-lg shadow-indigo-500/20"
                >
                    + New User
                </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Table */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Name</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Email</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Role</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Status</th>
                            <th className="text-right px-5 py-3.5 text-slate-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar_url ?? undefined}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span className="font-medium text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400">{user.email}</td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                            {user.roles[0] ?? 'No role'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/users/${user.id}/edit`}
                                                className="text-slate-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-slate-700"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/users/${user.id}`}
                                                method="delete"
                                                as="button"
                                                className="text-red-400 hover:text-red-300 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
                                                onClick={(e) => {
                                                    if (!confirm('Are you sure you want to delete this user?')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {users.meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
                        <p className="text-sm text-slate-400">
                            Showing {users.meta.from}–{users.meta.to} of {users.meta.total}
                        </p>
                        <div className="flex gap-2">
                            {users.links.prev && (
                                <Link
                                    href={users.links.prev}
                                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm transition-all"
                                >
                                    ← Prev
                                </Link>
                            )}
                            {users.links.next && (
                                <Link
                                    href={users.links.next}
                                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm transition-all"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
