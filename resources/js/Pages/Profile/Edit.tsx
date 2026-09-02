import { useState, useRef, useId } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import AvatarCropModal from '@/Components/AvatarCropModal';
import {
    User,
    Mail,
    Phone,
    Building2,
    ShieldCheck,
    Calendar,
    Hash,
    Lock,
    Shield,
    Camera,
    Trash2,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Check,
    KeyRound,
    Info,
} from 'lucide-react';

interface ProfileRole {
    name: string;
    label: string;
}

interface EditProfileProps {
    profile: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        avatar_url: string | null;
        status: string;
        status_label: string;
        roles: ProfileRole[];
        created_at: string;
    };
}

export default function EditProfile({ profile }: EditProfileProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);

    // Cropper modal states
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [fileValidationError, setFileValidationError] = useState<string | null>(null);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form 1: Profile Details
    const {
        data: profileData,
        setData: setProfileData,
        post: submitProfile,
        processing: profileProcessing,
        errors: profileErrors,
        recentlySuccessful: profileSaved,
    } = useForm<{
        name: string;
        phone: string;
        avatar: File | null;
        delete_avatar: boolean;
    }>({
        name: profile.name,
        phone: profile.phone || '',
        avatar: null,
        delete_avatar: false,
    });

    // Form 2: Password Update (Separate Form)
    const {
        data: passwordData,
        setData: setPasswordData,
        put: submitPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        reset: resetPasswordForm,
        recentlySuccessful: passwordSaved,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Generate unique input IDs for accessibility
    const nameInputId = useId();
    const phoneInputId = useId();
    const emailInputId = useId();
    const currentPassId = useId();
    const newPassId = useId();
    const confirmPassId = useId();

    const primaryRoleLabel = profile.roles[0]?.label || 'Staf Internal';
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=F6C343&color=1a1a1a&bold=true&size=128`;

    // Handle Initial File Selection & Validation
    const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileValidationError(null);

        if (!file) return;

        // 1. Format validation
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setFileValidationError('Format berkas tidak didukung. Silakan gunakan format JPG, PNG, atau WEBP.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // 2. Size validation (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setFileValidationError('Ukuran foto terlalu besar (maksimal 2MB). Silakan pilih berkas yang lebih kecil.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // 3. Open Cropper Modal
        const objectUrl = URL.createObjectURL(file);
        setRawImageSrc(objectUrl);
        setCropModalOpen(true);
    };

    // Callback when crop is completed in modal
    const handleCropFinished = (croppedFile: File, croppedPreviewUrl: string) => {
        setProfileData((prev) => ({
            ...prev,
            avatar: croppedFile,
            delete_avatar: false,
        }));
        setIsDeletingAvatar(false);
        setAvatarPreview(croppedPreviewUrl);
        setFileValidationError(null);
    };

    // Handle Remove Avatar
    const handleRemoveAvatar = () => {
        setProfileData((prev) => ({
            ...prev,
            avatar: null,
            delete_avatar: true,
        }));
        setIsDeletingAvatar(true);
        setAvatarPreview(null);
        setFileValidationError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Submit Profile
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitProfile('/profil', {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeletingAvatar(false);
            },
        });
    };

    // Submit Password
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitPassword('/profil/password', {
            preserveScroll: true,
            onSuccess: () => {
                resetPasswordForm();
            },
        });
    };

    // Real-time password validation helpers
    const pwd = passwordData.password;
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
    const isMatching = passwordData.password_confirmation.length > 0 && pwd === passwordData.password_confirmation;

    return (
        <DashboardLayout>
            <Head title="Edit Profil - Customer Portal GTD MoveLog" />

            {/* ── Image Cropper Modal ── */}
            <AvatarCropModal
                isOpen={cropModalOpen}
                imageSrc={rawImageSrc}
                onClose={() => {
                    setCropModalOpen(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onCropComplete={handleCropFinished}
            />

            <div className="space-y-6">
                {/* ── Breadcrumb & Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                            <Link
                                href="/"
                                className="hover:text-slate-700 transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft size={13} strokeWidth={2} />
                                <span>Dashboard</span>
                            </Link>
                            <span>/</span>
                            <span className="text-slate-700">Pengaturan Akun</span>
                            <span>/</span>
                            <span className="text-[#06283A] font-bold">Edit Profil</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#06283A] tracking-tight">
                            Kelola Profil & Keamanan Akun
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Perbarui identitas pribadi, foto profil, dan kata sandi Anda.
                        </p>
                    </div>
                </div>

                {/* ── Main 2-Column Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── Left Column: Identity & Company Info (5 Cols) ── */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Avatar & Card Ringkasan Akun */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center relative overflow-hidden">
                            <div className="flex flex-col items-center">
                                {/* Avatar Container with proper bottom breathing space */}
                                <div className="relative group">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-slate-100 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center">
                                        <img
                                            src={avatarPreview || fallbackAvatar}
                                            alt={profile.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-[#06283A] text-white hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-md cursor-pointer group-hover:scale-105"
                                        title="Ubah & Potong Foto Profil"
                                    >
                                        <Camera size={15} strokeWidth={2} />
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarFileSelect}
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    className="hidden"
                                />

                                {/* Name & Info with generous spacing */}
                                <div className="mt-6 space-y-1">
                                    <h2 className="text-base sm:text-lg font-bold text-[#06283A] leading-snug">
                                        {profileData.name || profile.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {profile.email}
                                    </p>
                                </div>

                                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-gray-900 border border-yellow-400/40 shadow-xs">
                                    <Shield size={13} className="text-yellow-700" strokeWidth={2.4} />
                                    <span>{primaryRoleLabel}</span>
                                </div>

                                {/* Avatar Actions */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-100 w-full">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Camera size={14} className="text-slate-500" />
                                        <span>Pilih Foto</span>
                                    </button>

                                    {(avatarPreview || profile.avatar) && !isDeletingAvatar && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3.5 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Trash2 size={14} />
                                            <span>Hapus Foto</span>
                                        </button>
                                    )}
                                </div>

                                {fileValidationError && (
                                    <p className="text-xs text-red-600 mt-2.5 font-medium flex items-center gap-1">
                                        <AlertCircle size={13} className="shrink-0" />
                                        <span>{fileValidationError}</span>
                                    </p>
                                )}

                                {profileErrors.avatar && (
                                    <p className="text-xs text-red-600 mt-2 font-medium">
                                        {profileErrors.avatar}
                                    </p>
                                )}

                                <p className="text-[11px] text-slate-400 mt-2">
                                    Format: JPG, PNG, WEBP (Maksimal 2MB). Disertai fitur potong lingkaran & zoom.
                                </p>
                            </div>
                        </div>

                        {/* Read-Only Internal Account & Authorization Information */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                                <ShieldCheck size={18} className="text-yellow-600 shrink-0" strokeWidth={2.2} />
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Informasi Akun & Wewenang (Read-Only)
                                    </h3>
                                    <p className="text-xs text-gray-600 font-medium">
                                        Kredensial dan hak akses sistem internal
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3.5">
                                {/* Role / Peran */}
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <Shield size={12} className="text-gray-400" />
                                        Peran / Jabatan Sistem
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {profile.roles.map((r) => (
                                            <span
                                                key={r.name}
                                                className="px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200"
                                            >
                                                {r.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Akun */}
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                        Status Akun
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {profile.status_label || 'Aktif'}
                                        </span>
                                    </div>
                                </div>

                                {/* ID Pengguna */}
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <Hash size={12} className="text-gray-400" />
                                        ID Pengguna Sistem
                                    </span>
                                    <p className="text-xs font-mono font-bold text-gray-800 mt-0.5 truncate bg-gray-50 px-2 py-1 rounded border border-gray-200/60">
                                        {profile.id}
                                    </p>
                                </div>

                                {/* Tanggal Bergabung */}
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <Calendar size={12} className="text-gray-400" />
                                        Terdaftar Sejak
                                    </span>
                                    <p className="text-xs font-semibold text-gray-700 mt-0.5">
                                        {profile.created_at}
                                    </p>
                                </div>

                                {/* Unit Kerja */}
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <Building2 size={12} className="text-gray-400" />
                                        Unit Kerja / Organisasi
                                    </span>
                                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                                        PT Global Trans Djaya (Internal LMS)
                                    </p>
                                </div>
                            </div>

                            {/* Security Notice Alert */}
                            <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] text-gray-600 leading-relaxed flex items-start gap-2">
                                <Info size={15} className="text-gray-400 shrink-0 mt-0.5" strokeWidth={2} />
                                <span>
                                    Wewenang, peran penugasan, dan status akun dikelola oleh{' '}
                                    <strong className="text-gray-800 font-semibold">Super Admin GTD</strong>. Hubungi Administrator jika terdapat penyesuaian wewenang atau mutasi tugas.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Forms (7 Cols) ── */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* ── Form Section 1: Profil Pribadi ── */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2">
                                    <User size={18} className="text-slate-700" strokeWidth={2} />
                                    <h3 className="text-sm sm:text-base font-bold text-[#06283A]">
                                        Informasi Profil Pribadi
                                    </h3>
                                </div>
                                {profileSaved && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in">
                                        <Check size={14} strokeWidth={2.5} />
                                        <span>Tersimpan</span>
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                {/* Nama Lengkap */}
                                <div>
                                    <label
                                        htmlFor={nameInputId}
                                        className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                                    >
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={nameInputId}
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData('name', e.target.value)}
                                            required
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium"
                                            placeholder="Masukkan nama lengkap Anda"
                                        />
                                    </div>
                                    {profileErrors.name && (
                                        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={13} />
                                            <span>{profileErrors.name}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Nomor Telepon */}
                                <div>
                                    <label
                                        htmlFor={phoneInputId}
                                        className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                                    >
                                        Nomor Telepon Pribadi / WhatsApp
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Phone size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={phoneInputId}
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData('phone', e.target.value)}
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium"
                                            placeholder="Contoh: 081234567890"
                                        />
                                    </div>
                                    {profileErrors.phone && (
                                        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={13} />
                                            <span>{profileErrors.phone}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Email (Read-Only) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label
                                            htmlFor={emailInputId}
                                            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
                                        >
                                            Alamat Email Akun
                                        </label>
                                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                            <Lock size={11} />
                                            <span>Terkunci</span>
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Mail size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={emailInputId}
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed select-none"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Alamat email akun telah diverifikasi. Perubahan email dinonaktifkan untuk fase ini.
                                    </p>
                                </div>

                                {/* Save Button */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileProcessing}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-[#06283A] transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                                        style={{ backgroundColor: '#F6C343' }}
                                    >
                                        {profileProcessing ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={15} strokeWidth={2.2} />
                                                <span>Simpan Perubahan Profil</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* ── Form Section 2: Ganti Password (Terpisah) ── */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2">
                                    <KeyRound size={18} className="text-slate-700" strokeWidth={2} />
                                    <h3 className="text-sm sm:text-base font-bold text-[#06283A]">
                                        Perbarui Kata Sandi
                                    </h3>
                                </div>
                                {passwordSaved && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in">
                                        <Check size={14} strokeWidth={2.5} />
                                        <span>Password Diperbarui</span>
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                {/* Password Saat Ini */}
                                <div>
                                    <label
                                        htmlFor={currentPassId}
                                        className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                                    >
                                        Password Saat Ini <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Lock size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={currentPassId}
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                                            required
                                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium"
                                            placeholder="Ketik password Anda saat ini"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {passwordErrors.current_password && (
                                        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={13} />
                                            <span>{passwordErrors.current_password}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Password Baru */}
                                <div>
                                    <label
                                        htmlFor={newPassId}
                                        className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                                    >
                                        Password Baru <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <KeyRound size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={newPassId}
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData('password', e.target.value)}
                                            required
                                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium"
                                            placeholder="Minimal 8 karakter (huruf, angka, simbol)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {passwordErrors.password && (
                                        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={13} />
                                            <span>{passwordErrors.password}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Checklist Kompleksitas Password Real-time */}
                                {pwd.length > 0 && (
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                                        <p className="text-[11px] font-bold text-slate-700">
                                            Ketentuan Password Baru:
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                                            <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                                <Check size={12} strokeWidth={2.5} />
                                                <span>Min. 8 Karakter</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                                <Check size={12} strokeWidth={2.5} />
                                                <span>Huruf Besar & Kecil</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                                <Check size={12} strokeWidth={2.5} />
                                                <span>Mengandung Angka</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                                <Check size={12} strokeWidth={2.5} />
                                                <span>Mengandung Simbol</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Konfirmasi Password Baru */}
                                <div>
                                    <label
                                        htmlFor={confirmPassId}
                                        className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
                                    >
                                        Konfirmasi Password Baru <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <KeyRound size={15} strokeWidth={1.8} />
                                        </div>
                                        <input
                                            id={confirmPassId}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                            required
                                            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all font-medium"
                                            placeholder="Ulangi password baru Anda"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {passwordErrors.password_confirmation && (
                                        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={13} />
                                            <span>{passwordErrors.password_confirmation}</span>
                                        </p>
                                    )}
                                    {passwordData.password_confirmation.length > 0 && (
                                        <p className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${isMatching ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {isMatching ? (
                                                <>
                                                    <Check size={12} strokeWidth={2.5} />
                                                    <span>Konfirmasi password cocok</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={12} />
                                                    <span>Konfirmasi password belum cocok</span>
                                                </>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Update Password Button */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordProcessing}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#06283A] text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        {passwordProcessing ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                <span>Memperbarui...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={15} strokeWidth={2.2} />
                                                <span>Perbarui Password</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
