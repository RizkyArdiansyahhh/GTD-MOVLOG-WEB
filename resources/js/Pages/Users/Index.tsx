import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader } from '@/Components/ui';
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
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        inactive: 'bg-slate-100 text-slate-500 border-slate-200',
        banned: 'bg-red-50 text-red-700 border-red-200',
        pending: 'bg-amber-50 text-amber-800 border-amber-200',
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
        <DashboardLayout title="User Management">
            <Head title="Users" />

            <div className="space-y-6">
                <PageHeader
                    title="Users"
                    subtitle={`${users.meta.total} total users`}
                    actions={
                        <Link
                            href="/users/create"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#06283A] bg-[#F6C343] hover:bg-[#E0AD2C] transition-colors shadow-sm"
                        >
                            + New User
                        </Link>
                    }
                />

                {/* Search */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <form onSubmit={handleSearch}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F6C343] focus:border-transparent text-sm transition-all"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl bg-[#06283A] hover:opacity-90 text-white text-sm font-medium transition-all"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/60">
                                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar_url ?? undefined}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <span className="font-medium text-[#06283A]">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{user.email}</td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs text-[#06283A] bg-[#F6C343]/15 px-2 py-0.5 rounded border border-[#F6C343]/30">
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
                                                    className="text-slate-500 hover:text-[#06283A] transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-slate-100"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={`/users/${user.id}`}
                                                    method="delete"
                                                    as="button"
                                                    className="text-red-600 hover:text-red-700 transition-colors text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
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
                        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
                            <p className="text-sm text-slate-500">
                                Showing {users.meta.from}–{users.meta.to} of {users.meta.total}
                            </p>
                            <div className="flex gap-2">
                                {users.links.prev && (
                                    <Link
                                        href={users.links.prev}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#06283A] text-sm font-medium transition-all"
                                    >
                                        ← Prev
                                    </Link>
                                )}
                                {users.links.next && (
                                    <Link
                                        href={users.links.next}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#06283A] text-sm font-medium transition-all"
                                    >
                                        Next →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
