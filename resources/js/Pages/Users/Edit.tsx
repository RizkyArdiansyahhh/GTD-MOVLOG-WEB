import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronRight, ArrowLeft, Shield, User as UserIcon, Lock, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';

interface UserEditData {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone?: string | null;
}

interface EditUserProps extends PageProps {
    user: UserEditData;
}

/**
 * Map Spatie role names or display labels to enum value.
 */
function normalizeRole(role: string): string {
    const r = role.toLowerCase();
    if (r === 'super admin' || r === 'super-admin') return 'super-admin';
    if (r === 'supervisor') return 'supervisor';
    if (r === 'staff') return 'staff';
    if (r === 'field worker' || r === 'field-worker') return 'field-worker';
    if (r === 'customer') return 'customer';
    return r;
}

/**
 * Map status string or enum to normalized status value ('active' | 'inactive' | 'pending').
 */
function normalizeStatus(status: string): string {
    const s = status.toLowerCase();
    if (s === 'aktif' || s === 'active') return 'active';
    if (s === 'tidak aktif' || s === 'inactive') return 'inactive';
    if (s === 'pending' || s === 'pending verification') return 'pending';
    return s;
}

export default function Edit({ user }: EditUserProps) {
    const initialRole = normalizeRole(user.role || 'staff');
    const initialStatus = normalizeStatus(user.status || 'active');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        role: initialRole,
        status: initialStatus,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title={`Edit User ${user.name} — Global Trans Djaya`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* ── Breadcrumb & Navigation Header ── */}
                <div>
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link
                            href="/kelola-akun"
                            className="hover:text-[#06283A] transition-colors flex items-center gap-1 font-medium"
                        >
                            <ArrowLeft size={16} />
                            Kelola Akun
                        </Link>
                        <ChevronRight size={14} className="text-gray-400" />
                        <span className="text-gray-900 font-semibold">Edit User</span>
                    </nav>
                    <h1 className="text-2xl font-bold" style={{ color: '#06283A' }}>
                        Edit User
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Perbarui informasi pengguna dan hak akses sistem untuk <strong>{user.name}</strong>.
                    </p>
                </div>

                {/* ── Main Form Card ── */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8"
                >
                    {/* ── Section 1: Personal Information ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <UserIcon size={18} className="text-[#06283A]" />
                            <h2 className="text-base font-bold" style={{ color: '#06283A' }}>
                                Personal Information
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                        errors.name
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
                                )}
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@perusahaan.com"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                        errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: System Access ── */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <Shield size={18} className="text-[#06283A]" />
                            <h2 className="text-base font-bold" style={{ color: '#06283A' }}>
                                System Access
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Role */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white transition-all focus:outline-none focus:ring-2 ${
                                        errors.role
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                >
                                    <option value="super-admin">Super Admin</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="staff">Staff</option>
                                    <option value="field-worker">Field Worker</option>
                                    <option value="customer">Customer</option>
                                </select>
                                {errors.role && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.role}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Account Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white transition-all focus:outline-none focus:ring-2 ${
                                        errors.status
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                >
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Tidak Aktif</option>
                                    <option value="pending">Pending Verification</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.status}</p>
                                )}
                            </div>

                            {/* Password (Optional) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Password <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <p className="text-[11px] text-gray-400 mb-1.5">
                                    Biarkan kosong jika tidak ingin mengubah password.
                                </p>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                        errors.password
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password (Optional) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Confirm Password <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <p className="text-[11px] text-gray-400 mb-1.5">
                                    Ulangi password baru yang Anda masukkan.
                                </p>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                        errors.password_confirmation
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-[#F5B800] focus:ring-[#F5B800]/20'
                                    }`}
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Action Buttons ── */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        {/* Cancel Button (Bottom Left) */}
                        <Link
                            href="/kelola-akun"
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                            Cancel
                        </Link>

                        {/* Save Changes Button (Bottom Right) */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#F5B800',
                                color: '#06283A',
                            }}
                        >
                            {processing ? (
                                <span>Menyimpan...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
