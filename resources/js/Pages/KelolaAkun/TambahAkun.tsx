import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, Save, X, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PageProps } from '@/types';
import ToastNotification, { type ToastMessage } from './components/ToastNotification';

// ─────────────────────────────────────────────
// Props interface
// ─────────────────────────────────────────────
interface RoleOption {
    value: string;
    label: string;
}

interface CompanyOption {
    id: string;
    name: string;
    company_name?: string;
}

interface TambahAkunProps extends PageProps {
    availableRoles: RoleOption[];
    companies: CompanyOption[];
}

// ─────────────────────────────────────────────
// Form data interface
// ─────────────────────────────────────────────
interface FormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    company_id: string;
    password: string;
    password_confirmation: string;
    status: string;
}

// ─────────────────────────────────────────────
// Tambah Akun Page
// ─────────────────────────────────────────────
export default function TambahAkun() {
    const { availableRoles, companies = [], errors } = usePage<TambahAkunProps>().props;

    const [form, setForm] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        role: '',
        company_id: '',
        password: '',
        password_confirmation: '',
        status: 'active',
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Check if currently selected role is Customer
    const isCustomerRole = (roleValue: string) => {
        return roleValue.toLowerCase() === 'customer';
    };

    const isCustomer = isCustomerRole(form.role);

    const handleChange = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (clientErrors[field]) {
            setClientErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleRoleChange = (selectedRole: string) => {
        const nextIsCustomer = isCustomerRole(selectedRole);
        setForm((prev) => ({
            ...prev,
            role: selectedRole,
            // Clear company if role is changed from Customer to another role
            company_id: nextIsCustomer ? prev.company_id : '',
        }));

        setClientErrors((prev) => {
            const next = { ...prev };
            delete next.role;
            if (!nextIsCustomer) {
                delete next.company_id;
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation: Company Name is required when role is Customer
        if (isCustomer && !form.company_id) {
            setClientErrors((prev) => ({
                ...prev,
                company_id: 'Company Name is required when the selected role is Customer.',
            }));
            setToast({
                id: String(Date.now()),
                type: 'error',
                message: 'Company Name is required when the selected role is Customer.',
            });
            return;
        }

        setIsSubmitting(true);

        const payload = {
            ...form,
            company_id: isCustomer ? form.company_id : null,
        };

        router.post('/kelola-akun/tambah', payload as any, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const firstErrorMessage =
                    errs?.company_id ||
                    errs?.customer_id ||
                    errs?.role ||
                    errs?.email ||
                    errs?.password ||
                    'Failed to create account. Please check the entered data.';
                setToast({
                    id: String(Date.now()),
                    type: 'error',
                    message: firstErrorMessage,
                });
            },
        });
    };

    // Validation errors from server
    const serverErrors = errors as Record<string, string>;
    const companyError = clientErrors.company_id || serverErrors.company_id || serverErrors.customer_id;

    return (
        <DashboardLayout>
            <Head title="Add Account — Global Trans Djaya" />

            {/* Floating Toast Notification */}
            <ToastNotification toast={toast} onClose={() => setToast(null)} />

            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-1.5 text-sm mb-4 flex-wrap">
                <Link
                    href="/kelola-akun"
                    className="font-medium transition-colors duration-150 hover:opacity-80"
                    style={{ color: '#F5B800' }}
                >
                    Kelola Akun
                </Link>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                <span className="font-medium text-gray-500">Add Account</span>
            </nav>

            {/* ── Page Title ── */}
            <h1
                className="text-2xl font-bold mb-6"
                style={{ color: '#06283A' }}
            >
                Tambah Akun
            </h1>

            {/* ── Form Card ── */}
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* ── Section: Data Pribadi ── */}
                        <div className="p-6 sm:p-8">
                            <h2
                                className="text-base font-bold mb-5"
                                style={{ color: '#06283A' }}
                            >
                                Data Pribadi
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* Nama Lengkap */}
                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        className={`w-full rounded-xl px-4 text-sm text-gray-700 placeholder-gray-400 border outline-none transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                            serverErrors.name
                                                ? 'border-red-300 focus:border-red-400'
                                                : 'border-gray-200 focus:border-amber-300'
                                        }`}
                                        style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                    />
                                    {serverErrors.name && (
                                        <p className="text-xs text-red-500 mt-1">{serverErrors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="contoh@email.com"
                                        className={`w-full rounded-xl px-4 text-sm text-gray-700 placeholder-gray-400 border outline-none transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                            serverErrors.email
                                                ? 'border-red-300 focus:border-red-400'
                                                : 'border-gray-200 focus:border-amber-300'
                                        }`}
                                        style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                    />
                                    {serverErrors.email && (
                                        <p className="text-xs text-red-500 mt-1">{serverErrors.email}</p>
                                    )}
                                </div>

                                {/* Nomor Telepon */}
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Nomor Telepon
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                        className={`w-full rounded-xl px-4 text-sm text-gray-700 placeholder-gray-400 border outline-none transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                            serverErrors.phone
                                                ? 'border-red-300 focus:border-red-400'
                                                : 'border-gray-200 focus:border-amber-300'
                                        }`}
                                        style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                    />
                                    {serverErrors.phone && (
                                        <p className="text-xs text-red-500 mt-1">{serverErrors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Divider ── */}
                        <div className="border-t border-gray-100" />

                        {/* ── Section: Akses Sistem ── */}
                        <div className="p-6 sm:p-8">
                            <h2
                                className="text-base font-bold mb-5"
                                style={{ color: '#06283A' }}
                            >
                                Akses Sistem
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* Role */}
                                <div className={isCustomer ? "md:col-span-1" : "md:col-span-2"}>
                                    <label
                                        htmlFor="role"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="role"
                                        value={form.role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        className={`w-full rounded-xl px-4 text-sm text-gray-700 border outline-none cursor-pointer transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                            serverErrors.role || clientErrors.role
                                                ? 'border-red-300 focus:border-red-400'
                                                : 'border-gray-200 focus:border-amber-300'
                                        }`}
                                        style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                    >
                                        <option value="">Select Role</option>
                                        {availableRoles?.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    {(serverErrors.role || clientErrors.role) && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {serverErrors.role || clientErrors.role}
                                        </p>
                                    )}
                                </div>

                                {/* Company Name (Dynamically displayed when Role is Customer) */}
                                {isCustomer && (
                                    <div className="md:col-span-1">
                                        <label
                                            htmlFor="company_id"
                                            className="block text-sm font-medium mb-1.5"
                                            style={{ color: '#06283A' }}
                                        >
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="company_id"
                                            value={form.company_id}
                                            onChange={(e) => handleChange('company_id', e.target.value)}
                                            className={`w-full rounded-xl px-4 text-sm text-gray-700 border outline-none cursor-pointer transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                                companyError
                                                    ? 'border-red-300 focus:border-red-400'
                                                    : 'border-gray-200 focus:border-amber-300'
                                            }`}
                                            style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map((company) => (
                                                <option key={company.id} value={company.id}>
                                                    {company.name || company.company_name}
                                                </option>
                                            ))}
                                        </select>
                                        {companies.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                No companies available. Please create a company in Submit Berkas first.
                                            </p>
                                        )}
                                        {companyError && (
                                            <p className="text-xs text-red-500 mt-1">{companyError}</p>
                                        )}
                                    </div>
                                )}

                                {/* Temporary Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Temporary Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className={`w-full rounded-xl px-4 pr-11 text-sm text-gray-700 placeholder-gray-400 border outline-none transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                                serverErrors.password
                                                    ? 'border-red-300 focus:border-red-400'
                                                    : 'border-gray-200 focus:border-amber-300'
                                            }`}
                                            style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {serverErrors.password && (
                                        <p className="text-xs text-red-500 mt-1">{serverErrors.password}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="block text-sm font-medium mb-1.5"
                                        style={{ color: '#06283A' }}
                                    >
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={form.password_confirmation}
                                            onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                            placeholder="Repeat password"
                                            className={`w-full rounded-xl px-4 pr-11 text-sm text-gray-700 placeholder-gray-400 border outline-none transition-all duration-150 focus:ring-2 focus:ring-amber-100 ${
                                                serverErrors.password_confirmation
                                                    ? 'border-red-300 focus:border-red-400'
                                                    : 'border-gray-200 focus:border-amber-300'
                                            }`}
                                            style={{ height: 44, backgroundColor: '#F8FAFC' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {serverErrors.password_confirmation && (
                                        <p className="text-xs text-red-500 mt-1">{serverErrors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Footer Actions ── */}
                        <div className="border-t border-gray-100 px-6 sm:px-8 py-5">
                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                {/* Cancel */}
                                <Link
                                    href="/kelola-akun"
                                    className="flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 active:scale-[0.98]"
                                    style={{ height: 44 }}
                                >
                                    <X size={16} strokeWidth={2.2} />
                                    Cancel
                                </Link>

                                {/* Save User */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                    style={{
                                        height: 44,
                                        backgroundColor: '#F5B800',
                                        color: '#06283A',
                                    }}
                                >
                                    <Save size={16} strokeWidth={2.2} />
                                    {isSubmitting ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
