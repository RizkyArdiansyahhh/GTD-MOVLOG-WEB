import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Users, ShieldCheck, UserCheck, UserX, Plus, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import UserStatsCard from './components/UserStatsCard';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import Pagination from './components/Pagination';
import UserStatusConfirmationModal from './components/UserStatusConfirmationModal';
import UserDeleteConfirmationModal from './components/UserDeleteConfirmationModal';
import ToastNotification, { type ToastMessage } from './components/ToastNotification';
import type { KelolaAkunUser } from './types';
import { seederUsers, seederStats, roleOptions as defaultRoleOptions } from './data';

// ─────────────────────────────────────────────
// Props interface
// ─────────────────────────────────────────────
interface StatsData {
    totalPengguna: number;
    totalPenggunaBulanIni: number;
    adminInternal: number;
    customer: number;
    akunNonaktif: number;
}

interface PaginatedUsers {
    data: KelolaAkunUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Filters {
    search?: string;
    role?: string;
    status?: string;
    per_page?: string;
}

interface KelolaAkunProps extends PageProps {
    users?: PaginatedUsers;
    stats?: StatsData;
    availableRoles?: string[];
    filters?: Filters;
}

const ITEMS_PER_PAGE = 5;

// ─────────────────────────────────────────────
// Kelola Akun Page
// ─────────────────────────────────────────────
export default function Index() {
    const pageProps = usePage<KelolaAkunProps>().props;
    const { users, stats, availableRoles, filters, auth } = pageProps;

    // ── Access control ──
    const userRoles = auth?.user?.roles?.map((r) => r.toLowerCase()) ?? ['super-admin'];
    const isSuperAdmin = userRoles.includes('super-admin') || userRoles.includes('super admin');

    // Determine if server data is present and non-empty
    const hasServerData = users && Array.isArray(users.data) && users.data.length > 0;

    // Base user list: server data if available, otherwise exact AdminUserSeeder data
    const [localUsers, setLocalUsers] = useState<KelolaAkunUser[]>(seederUsers);
    const baseUsers: KelolaAkunUser[] = hasServerData ? users.data : localUsers;

    // Local state for filters
    const [search, setSearch] = useState(filters?.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters?.role ?? 'Semua Role');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'Semua Status');
    const [currentPage, setCurrentPage] = useState(users?.current_page ?? 1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // State for Status Confirmation Modal, Delete Confirmation Modal & Toast
    const [modalUser, setModalUser] = useState<KelolaAkunUser | null>(null);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [deleteModalUser, setDeleteModalUser] = useState<KelolaAkunUser | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Filtered users (works for both server fallback and local client filter)
    const filteredUsers = useMemo(() => {
        if (hasServerData) return baseUsers; // Server already filtered

        return baseUsers.filter((user) => {
            const matchSearch =
                search === '' ||
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());

            const matchRole =
                roleFilter === 'Semua Role' || user.role === roleFilter;

            const matchStatus =
                statusFilter === 'Semua Status' || user.status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });
    }, [baseUsers, search, roleFilter, statusFilter, hasServerData]);

    // Computed stats
    const displayStats: StatsData = useMemo(() => {
        if (stats) return stats;

        const total = baseUsers.length;
        const customerCount = baseUsers.filter((u) => u.role === 'Customer').length;
        const adminCount = total - customerCount;
        const inactiveCount = baseUsers.filter((u) => u.status === 'Tidak Aktif').length;

        return {
            totalPengguna: total,
            totalPenggunaBulanIni: total,
            adminInternal: adminCount,
            customer: customerCount,
            akunNonaktif: inactiveCount,
        };
    }, [stats, baseUsers]);

    // Available role options
    const roleOptions = availableRoles && availableRoles.length > 0
        ? ['Semua Role', ...availableRoles]
        : Array.from(defaultRoleOptions);

    // Handlers
    const hasActiveFilters = search !== '' || roleFilter !== 'Semua Role' || statusFilter !== 'Semua Status';

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (hasServerData) {
            router.get('/kelola-akun', { search: value, role: roleFilter, status: statusFilter }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleSearchSubmit = () => {
        if (hasServerData) {
            router.get('/kelola-akun', { search, role: roleFilter, status: statusFilter }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleRoleChange = (value: string) => {
        setRoleFilter(value);
        if (hasServerData) {
            router.get('/kelola-akun', { search, role: value, status: statusFilter }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        if (hasServerData) {
            router.get('/kelola-akun', { search, role: roleFilter, status: value }, { preserveState: true, preserveScroll: true });
        }
    };

    const handleReset = () => {
        setSearch('');
        setRoleFilter('Semua Role');
        setStatusFilter('Semua Status');
        setCurrentPage(1);
        if (hasServerData) {
            router.get('/kelola-akun', {}, { preserveState: true, preserveScroll: true });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        if (hasServerData) {
            router.get('/kelola-akun', { search, role: roleFilter, status: statusFilter, page: String(page) }, { preserveState: true, preserveScroll: true });
        }
        setSelectedIds(new Set());
    };

    // Status toggle handlers
    const handleStatusToggleClick = (user: KelolaAkunUser) => {
        setModalUser(user);
    };

    const handleConfirmStatusChange = () => {
        if (!modalUser) return;

        const nextStatus = modalUser.status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
        const actionLabel = nextStatus === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan';

        setIsSubmittingStatus(true);
        setUpdatingUserId(modalUser.id);

        const updateLocal = () => {
            setLocalUsers((prev) =>
                prev.map((u) => (u.id === modalUser.id ? { ...u, status: nextStatus } : u))
            );
        };

        if (hasServerData) {
            // Server-side status update request via Inertia router.patch
            router.patch(
                `/kelola-akun/${modalUser.id}/status`,
                { status: nextStatus },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onSuccess: () => {
                        updateLocal();
                        setIsSubmittingStatus(false);
                        setUpdatingUserId(null);
                        setModalUser(null);
                        setToast({
                            id: String(Date.now()),
                            type: 'success',
                            message: `Status akun ${modalUser.name} berhasil ${actionLabel}.`,
                        });
                    },
                    onError: (errors) => {
                        setIsSubmittingStatus(false);
                        setUpdatingUserId(null);
                        setModalUser(null);
                        const errMessage = errors?.status || `Gagal mengubah status akun ${modalUser.name}.`;
                        setToast({
                            id: String(Date.now()),
                            type: 'error',
                            message: errMessage,
                        });
                    },
                    onFinish: () => {
                        setIsSubmittingStatus(false);
                        setUpdatingUserId(null);
                    },
                }
            );
        } else {
            // Local state fallback update
            setTimeout(() => {
                updateLocal();
                setIsSubmittingStatus(false);
                setUpdatingUserId(null);
                setModalUser(null);
                setToast({
                    id: String(Date.now()),
                    type: 'success',
                    message: `Status akun ${modalUser.name} berhasil ${actionLabel}.`,
                });
            }, 300);
        }
    };

    // Delete user handlers
    const handleDeleteClick = (user: KelolaAkunUser) => {
        setDeleteModalUser(user);
    };

    const handleConfirmDelete = () => {
        if (!deleteModalUser) return;

        setIsSubmittingDelete(true);

        const updateLocal = () => {
            setLocalUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        };

        if (hasServerData) {
            router.delete(`/users/${deleteModalUser.id}`, {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    updateLocal();
                    setIsSubmittingDelete(false);
                    setDeleteModalUser(null);
                    setToast({
                        id: String(Date.now()),
                        type: 'success',
                        message: '✅ Pengguna berhasil dihapus.',
                    });
                },
                onError: (errors) => {
                    setIsSubmittingDelete(false);
                    setDeleteModalUser(null);
                    const errMessage = errors?.error || errors?.message || (typeof errors === 'string' ? errors : Object.values(errors)[0]) || '';
                    setToast({
                        id: String(Date.now()),
                        type: 'error',
                        message: `❌ Gagal menghapus pengguna.${errMessage ? ` ${errMessage}` : ''}`,
                    });
                },
                onFinish: () => {
                    setIsSubmittingDelete(false);
                },
            });
        } else {
            setTimeout(() => {
                updateLocal();
                setIsSubmittingDelete(false);
                setDeleteModalUser(null);
                setToast({
                    id: String(Date.now()),
                    type: 'success',
                    message: '✅ Pengguna berhasil dihapus.',
                });
            }, 300);
        }
    };

    // Pagination bounds
    const totalPages = hasServerData ? (users.last_page ?? 1) : Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
    const paginatedUsers = hasServerData ? filteredUsers : filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalItems = hasServerData ? (users.total ?? filteredUsers.length) : filteredUsers.length;

    // Selection
    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleSelectAll = () => {
        const allCurrentIds = paginatedUsers.map((u) => u.id);
        const allSelected = allCurrentIds.every((id) => selectedIds.has(id));
        if (allSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                allCurrentIds.forEach((id) => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                allCurrentIds.forEach((id) => next.add(id));
                return next;
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title="Kelola Akun — Global Trans Djaya" />

            {/* Floating Toast Notification */}
            <ToastNotification toast={toast} onClose={() => setToast(null)} />

            {/* Status Confirmation Modal */}
            <UserStatusConfirmationModal
                isOpen={modalUser !== null}
                user={modalUser}
                onClose={() => setModalUser(null)}
                onConfirm={handleConfirmStatusChange}
                isSubmitting={isSubmittingStatus}
            />

            {/* Delete Confirmation Modal */}
            <UserDeleteConfirmationModal
                isOpen={deleteModalUser !== null}
                user={deleteModalUser}
                onClose={() => setDeleteModalUser(null)}
                onConfirm={handleConfirmDelete}
                isSubmitting={isSubmittingDelete}
            />

            {!isSuperAdmin ? (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center my-8">
                    <div
                        className="flex items-center justify-center rounded-full mx-auto mb-4"
                        style={{ width: 56, height: 56, backgroundColor: '#fef2f2' }}
                    >
                        <AlertCircle size={28} className="text-red-500" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Akses Ditolak</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Halaman <strong>Kelola Akun</strong> hanya dapat diakses oleh pengguna dengan role <strong>super-admin</strong>.
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1
                                className="text-2xl font-bold"
                                style={{ color: '#06283A' }}
                            >
                                Kelola Akun
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola seluruh akun pengguna beserta role, status, dan aktivitas terakhir.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.98] shrink-0 cursor-pointer w-full sm:w-auto"
                            style={{
                                height: 44,
                                backgroundColor: '#F5B800',
                                color: '#06283A',
                            }}
                        >
                            <Plus size={18} strokeWidth={2.2} />
                            Tambah Pengguna Baru
                        </button>
                    </div>

                    {/* ── Stats Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <UserStatsCard
                            label="Total Pengguna"
                            value={displayStats.totalPengguna.toLocaleString('id-ID')}
                            subtitle={`+${displayStats.totalPenggunaBulanIni} pengguna bulan ini`}
                            icon={Users}
                            accent="#6366f1"
                        />
                        <UserStatsCard
                            label="Admin Internal"
                            value={displayStats.adminInternal.toLocaleString('id-ID')}
                            subtitle="Aktif"
                            icon={ShieldCheck}
                            accent="#3b82f6"
                        />
                        <UserStatsCard
                            label="Customer"
                            value={displayStats.customer.toLocaleString('id-ID')}
                            subtitle="Terdaftar"
                            icon={UserCheck}
                            accent="#10b981"
                        />
                        <UserStatsCard
                            label="Akun Nonaktif"
                            value={displayStats.akunNonaktif.toLocaleString('id-ID')}
                            subtitle="Perlu ditinjau"
                            icon={UserX}
                            accent="#ef4444"
                        />
                    </div>

                    {/* ── Filters ── */}
                    <UserFilters
                        search={search}
                        onSearchChange={handleSearchChange}
                        onSearchSubmit={handleSearchSubmit}
                        roleFilter={roleFilter}
                        onRoleFilterChange={handleRoleChange}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusChange}
                        onReset={handleReset}
                        hasActiveFilters={hasActiveFilters}
                        roleOptions={roleOptions}
                    />

                    {/* ── User Table ── */}
                    <UserTable
                        users={paginatedUsers}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                        onStatusToggleClick={handleStatusToggleClick}
                        onDeleteClick={handleDeleteClick}
                        updatingUserId={updatingUserId}
                    />

                    {/* ── Pagination ── */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={totalItems}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </>
            )}
        </DashboardLayout>
    );
}
