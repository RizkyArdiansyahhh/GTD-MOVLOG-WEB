import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState, type FormEventHandler } from 'react';
import BlurText from './BlurText';

/* ── Password strength helpers ─────────────────────────────────── */
interface PasswordCriteria {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
}

type StrengthLevel = 'none' | 'lemah' | 'sedang' | 'kuat';

function getPasswordCriteria(password: string): PasswordCriteria {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[^A-Za-z0-9]/.test(password),
    };
}

function getStrengthLevel(criteria: PasswordCriteria): StrengthLevel {
    const passed = Object.values(criteria).filter(Boolean).length;
    if (passed === 0) return 'none';
    if (passed <= 2) return 'lemah';
    if (passed === 3) return 'sedang';
    return 'kuat';
}

const strengthConfig: Record<Exclude<StrengthLevel, 'none'>, { label: string; color: string; width: string }> = {
    lemah:  { label: 'Lemah',  color: 'bg-red-500',    width: 'w-1/3' },
    sedang: { label: 'Sedang', color: 'bg-amber-500',  width: 'w-2/3' },
    kuat:   { label: 'Kuat',   color: 'bg-emerald-500', width: 'w-full' },
};

/* ── Animation helpers ─────────────────────────────────────────── */
const fadeBlurUp = (delay: number) => ({
    initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
    animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const, delay },
});

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' as const, delay },
});

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const openTermsModal = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setShowTermsModal(true);
    }, []);

    const passwordCriteria = useMemo(() => getPasswordCriteria(data.password), [data.password]);
    const strengthLevel = useMemo(() => getStrengthLevel(passwordCriteria), [passwordCriteria]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <>
            <Head title="Daftar" />

            {/* Google Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
                rel="stylesheet"
            />

            <div className="min-h-screen flex font-body bg-[#F7F7F5] relative overflow-hidden">
                {/* ══════════════════════════════════════════════════
                    GLOBAL BACKGROUND FOR MOBILE/TABLET
                    ══════════════════════════════════════════════════ */}
                <div className="absolute inset-0 lg:hidden z-0">
                    <img
                        src="/service-project.png"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover blur-[8px] scale-105"
                    />
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                </div>

                {/* ══════════════════════════════════════════════════
                    LEFT PANEL — Branding (Desktop only)
                    ══════════════════════════════════════════════════ */}
                <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden shrink-0">
                    {/* Background image */}
                    <img
                        src="/service-project.png"
                        alt="Service Vessel"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a2e]/90 via-[#0f1a2e]/85 to-[#0f1a2e]/95" />

                    {/* Content container */}
                    <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                        {/* Top — Logo & Brand Name */}
                        <motion.div
                            {...fadeBlurUp(0.2)}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center p-1.5">
                                <img src="/logo.png" alt="GlobalTransDjaya Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-white font-heading font-semibold text-lg tracking-wide">
                                GlobalTransDjaya
                            </span>
                        </motion.div>

                        {/* Middle — Tagline & Description */}
                        <div className="flex-1 flex flex-col justify-center max-w-lg">
                            <motion.h2
                                {...fadeBlurUp(0.4)}
                                className="text-white font-heading font-bold text-3xl xl:text-4xl xl:leading-tight mb-5"
                            >
                                Bergabung Bersama Kami Untuk Solusi Logistik Terbaik.
                            </motion.h2>
                            <motion.p
                                {...fadeUp(0.6)}
                                className="text-white/60 font-body text-sm xl:text-base leading-relaxed"
                            >
                                Daftarkan akun Anda dan mulai kelola armada serta operasional logistik dengan sistem monitoring real-time.
                            </motion.p>
                        </div>

                        {/* Bottom Footer */}
                        <motion.div
                            {...fadeUp(0.8)}
                            className="text-white/30 text-xs"
                        >
                            &copy; {new Date().getFullYear()} GlobalTransDjaya. All rights reserved.
                        </motion.div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════
                    RIGHT PANEL — Register Form
                    ══════════════════════════════════════════════════ */}
                <div className="w-full lg:w-[40%] flex flex-col justify-center items-center z-10 relative px-4 py-8 sm:px-6 lg:px-8 xl:px-12 min-h-screen">
                    {/* Header Logo for Mobile */}
                    <motion.div
                        {...fadeBlurUp(0.2)}
                        className="lg:hidden flex items-center gap-2 mb-8"
                    >
                        <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center p-1.5">
                            <img src="/logo.png" alt="GlobalTransDjaya Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-foreground font-heading font-bold text-base tracking-wide">
                            GlobalTransDjaya
                        </span>
                    </motion.div>

                    {/* Register Card wrapper */}
                    <div className="w-full max-w-[440px] bg-white/80 sm:bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl sm:shadow-xl sm:border sm:border-black/5 lg:shadow-none lg:border-none">
                        {/* Logo inside card (Desktop only) */}
                        <motion.div
                            {...fadeBlurUp(0.2)}
                            className="hidden lg:flex justify-center mb-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center p-2">
                                <img src="/logo.png" alt="GlobalTransDjaya Logo" className="w-full h-full object-contain" />
                            </div>
                        </motion.div>

                        {/* Title & Subtitle */}
                        <div className="text-center lg:text-left mb-6">
                            <h1 className="font-heading font-semibold text-foreground text-2xl md:text-3xl leading-tight tracking-[-1px] mb-2">
                                <BlurText text="Daftar Akun Baru" delay={0.3} />
                            </h1>
                            <motion.p
                                {...fadeUp(0.4)}
                                className="text-foreground/50 text-xs sm:text-sm font-body"
                            >
                                Buat akun baru untuk mengakses sistem manajemen armada.
                            </motion.p>
                        </div>

                        {/* Form */}
                        <motion.form
                            onSubmit={submit}
                            {...fadeUp(0.5)}
                            className="space-y-4"
                        >
                            {/* Full Name */}
                            <div>
                                <label
                                    htmlFor="register-name"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Nama Lengkap
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </span>
                                    <input
                                        id="register-name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama lengkap"
                                        autoComplete="name"
                                        className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white border border-foreground/10 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm font-body shadow-sm"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="register-email"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </span>
                                    <input
                                        id="register-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="nama@perusahaan.com"
                                        autoComplete="email"
                                        className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white border border-foreground/10 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm font-body shadow-sm"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="register-password"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Kata Sandi
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        id="register-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className="w-full pl-11 pr-12 py-2.5 rounded-lg bg-white border border-foreground/10 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm font-body shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {data.password.length > 0 && (
                                    <div className="mt-2.5 space-y-2">
                                        {/* Strength Bar */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                                                        strengthLevel !== 'none'
                                                            ? `${strengthConfig[strengthLevel].color} ${strengthConfig[strengthLevel].width}`
                                                            : 'w-0'
                                                    }`}
                                                />
                                            </div>
                                            {strengthLevel !== 'none' && (
                                                <span className={`text-[11px] font-medium font-body tracking-wide ${
                                                    strengthLevel === 'lemah' ? 'text-red-500'
                                                    : strengthLevel === 'sedang' ? 'text-amber-500'
                                                    : 'text-emerald-500'
                                                }`}>
                                                    {strengthConfig[strengthLevel].label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Criteria Checklist */}
                                        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                                            {[
                                                { key: 'minLength',    label: 'Min. 8 karakter',  met: passwordCriteria.minLength },
                                                { key: 'hasUppercase', label: 'Huruf kapital',     met: passwordCriteria.hasUppercase },
                                                { key: 'hasNumber',    label: 'Angka (0-9)',       met: passwordCriteria.hasNumber },
                                                { key: 'hasSymbol',    label: 'Simbol (!@#$)',     met: passwordCriteria.hasSymbol },
                                            ].map((c) => (
                                                <li key={c.key} className="flex items-center gap-1.5">
                                                    {c.met ? (
                                                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5 text-foreground/25 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="6" />
                                                        </svg>
                                                    )}
                                                    <span className={`text-[11px] font-body ${
                                                        c.met ? 'text-foreground/70' : 'text-foreground/40'
                                                    }`}>
                                                        {c.label}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="register-password-confirmation"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Konfirmasi Kata Sandi
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="register-password-confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className="w-full pl-11 pr-12 py-2.5 rounded-lg bg-white border border-foreground/10 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm font-body shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer"
                                        aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Terms and Conditions Checkbox */}
                            <div className="flex items-start gap-2">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={data.terms}
                                    onChange={(e) => setData('terms', e.target.checked)}
                                    className="h-4 w-4 mt-0.5 rounded border-foreground/20 text-gold focus:ring-gold accent-gold cursor-pointer"
                                />
                                <label htmlFor="terms" className="block text-xs sm:text-sm text-foreground/75 font-body cursor-pointer select-none leading-snug">
                                    Saya setuju dengan{' '}
                                    <button type="button" onClick={openTermsModal} className="text-gold hover:underline font-medium transition-colors cursor-pointer">
                                        Syarat & Ketentuan
                                    </button>
                                </label>
                            </div>
                            {errors.terms && (
                                <p className="text-xs text-red-500 font-body">
                                    {errors.terms}
                                </p>
                            )}

                            {/* Submit Button */}
                            <motion.div {...fadeUp(0.7)} className="pt-2">
                                <button
                                    id="register-submit"
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 px-4 rounded-lg bg-gold hover:bg-gold-hover disabled:opacity-60 disabled:cursor-not-allowed text-foreground font-body font-medium text-sm transition-all duration-200 shadow-md shadow-gold/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            Daftar Sekarang
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="8.5" cy="7" r="4" />
                                                <line x1="20" y1="8" x2="20" y2="14" />
                                                <line x1="23" y1="11" x2="17" y2="11" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.form>

                        {/* Divider */}
                        <motion.div {...fadeUp(0.8)} className="flex items-center my-6 gap-3">
                            <div className="flex-1 border-t border-foreground/10"></div>
                            <span className="text-xs text-foreground/45 uppercase tracking-wider font-body">atau</span>
                            <div className="flex-1 border-t border-foreground/10"></div>
                        </motion.div>

                        {/* Google Sign Up */}
                        <motion.div {...fadeUp(0.9)}>
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 transition-all text-xs sm:text-sm font-medium text-foreground/80 cursor-pointer shadow-sm"
                            >
                                <img src="/google-logo.png" alt="Google" className="h-4 w-4 shrink-0 object-contain" />
                                Daftar dengan Google
                            </button>
                        </motion.div>

                        {/* Footer Link */}
                        <motion.p
                            {...fadeUp(1.0)}
                            className="text-center text-xs sm:text-sm text-foreground/50 mt-6 font-body"
                        >
                            Sudah punya akun?{' '}
                            <a
                                href="/login"
                                className="text-gold hover:underline font-semibold transition-colors"
                            >
                                Masuk
                            </a>
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                TERMS & CONDITIONS MODAL
                ══════════════════════════════════════════════════ */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowTermsModal(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h2 className="font-heading font-semibold text-foreground text-lg">Syarat & Ketentuan</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-all cursor-pointer"
                                aria-label="Tutup"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body — Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-foreground/80 font-body leading-relaxed space-y-5">
                            {/* 1 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">1. Persetujuan Pengguna</h3>
                                <p>Dengan membuat akun dan menggunakan layanan GlobalTransDjaya, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</p>
                            </section>

                            {/* 2 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">2. Akun Pengguna</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Pengguna wajib memberikan informasi yang benar, lengkap, dan terbaru.</li>
                                    <li>Pengguna bertanggung jawab menjaga kerahasiaan email dan kata sandi.</li>
                                    <li>Segala aktivitas yang dilakukan melalui akun menjadi tanggung jawab pemilik akun.</li>
                                </ul>
                            </section>

                            {/* 3 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">3. Penggunaan Layanan</h3>
                                <p className="mb-1.5">Pengguna setuju untuk tidak:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Menggunakan layanan untuk aktivitas yang melanggar hukum.</li>
                                    <li>Memberikan informasi palsu.</li>
                                    <li>Mengakses akun pengguna lain tanpa izin.</li>
                                    <li>Mengganggu keamanan atau performa sistem.</li>
                                    <li>Menyalahgunakan layanan yang disediakan oleh GlobalTransDjaya.</li>
                                </ul>
                            </section>

                            {/* 4 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">4. Data Pribadi</h3>
                                <p className="mb-1.5">GlobalTransDjaya mengumpulkan data yang diperlukan untuk menyediakan layanan, seperti:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Nama</li>
                                    <li>Email</li>
                                    <li>Nomor telepon (jika diperlukan)</li>
                                    <li>Data yang berkaitan dengan penggunaan layanan</li>
                                </ul>
                                <p className="mt-2">Seluruh data pengguna akan dikelola sesuai dengan Kebijakan Privasi GlobalTransDjaya.</p>
                            </section>

                            {/* 5 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">5. Keamanan</h3>
                                <p>GlobalTransDjaya berupaya menjaga keamanan data pengguna dengan menerapkan langkah-langkah perlindungan yang wajar. Namun, pengguna tetap bertanggung jawab menjaga kerahasiaan akun dan kata sandinya.</p>
                            </section>

                            {/* 6 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">6. Hak Kekayaan Intelektual</h3>
                                <p>Seluruh logo, desain, konten, sistem, dan kode program yang terdapat pada GlobalTransDjaya merupakan hak milik perusahaan dan dilindungi oleh peraturan perundang-undangan yang berlaku. Pengguna dilarang menyalin, memodifikasi, atau mendistribusikannya tanpa izin tertulis.</p>
                            </section>

                            {/* 7 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">7. Penangguhan atau Penghapusan Akun</h3>
                                <p className="mb-1.5">GlobalTransDjaya berhak menangguhkan atau menghapus akun pengguna apabila:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Melanggar syarat dan ketentuan yang berlaku.</li>
                                    <li>Menyalahgunakan layanan.</li>
                                    <li>Melakukan tindakan yang merugikan perusahaan atau pengguna lain.</li>
                                    <li>Memberikan informasi yang tidak benar saat pendaftaran.</li>
                                </ul>
                            </section>

                            {/* 8 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">8. Perubahan Layanan dan Syarat</h3>
                                <p>GlobalTransDjaya berhak mengubah, menambah, atau memperbarui layanan maupun syarat dan ketentuan sewaktu-waktu. Perubahan akan diinformasikan melalui website atau email apabila diperlukan.</p>
                            </section>

                            {/* 9 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">9. Batas Tanggung Jawab</h3>
                                <p className="mb-1.5">GlobalTransDjaya tidak bertanggung jawab atas:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Kerugian akibat kelalaian pengguna dalam menjaga keamanan akun.</li>
                                    <li>Gangguan layanan yang disebabkan oleh pihak ketiga, gangguan jaringan, atau keadaan di luar kendali perusahaan.</li>
                                    <li>Kehilangan data yang disebabkan oleh tindakan pengguna sendiri.</li>
                                </ul>
                            </section>

                            {/* 10 */}
                            <section>
                                <h3 className="font-semibold text-foreground mb-1.5">10. Hubungi Kami</h3>
                                <p>Apabila terdapat pertanyaan mengenai syarat dan ketentuan ini, pengguna dapat menghubungi GlobalTransDjaya melalui email atau kontak resmi yang tersedia pada website.</p>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-foreground/10 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="w-full py-2.5 px-4 rounded-lg bg-gold hover:bg-gold-hover text-foreground font-body font-medium text-sm transition-all duration-200 shadow-md shadow-gold/20 cursor-pointer"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
