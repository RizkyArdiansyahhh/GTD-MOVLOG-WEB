import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, type FormEventHandler } from 'react';
import BlurText from './BlurText';

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

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Masuk" />

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
                        src="/service-vessel.png"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover blur-[8px] scale-105"
                    />
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                </div>

                {/* ══════════════════════════════════════════════════
                    LEFT PANEL — Branding (Desktop only)
                    ══════════════════════════════════════════════════ */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden shrink-0">
                    {/* Background image */}
                    <img
                        src="/service-vessel.png"
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
                                Optimalkan Logistik Berat Anda Dengan Presisi.
                            </motion.h2>
                            <motion.p
                                {...fadeUp(0.6)}
                                className="text-white/60 font-body text-sm xl:text-base leading-relaxed"
                            >
                                Sistem pemantauan armada dan manajemen sesi real-time kelas industri untuk operasional tanpa hambatan.
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
                    RIGHT PANEL — Login Form
                    ══════════════════════════════════════════════════ */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-center z-10 relative px-4 py-8 sm:px-6 lg:px-8 xl:px-16 min-h-screen">
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

                    {/* Login Card wrapper - Responsive shadow and styling */}
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
                                <BlurText text="Masuk ke Akun" delay={0.3} />
                            </h1>
                            <motion.p
                                {...fadeUp(0.4)}
                                className="text-foreground/50 text-xs sm:text-sm font-body"
                            >
                                Silakan masukkan kredensial Anda untuk melanjutkan ke dashboard.
                            </motion.p>
                        </div>

                        {/* Form */}
                        <motion.form
                            onSubmit={submit}
                            {...fadeUp(0.6)}
                            className="space-y-4"
                        >
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="login-email"
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
                                        id="login-email"
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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label
                                        htmlFor="login-password"
                                        className="block text-xs sm:text-sm font-medium text-foreground/80 font-body"
                                    >
                                        Kata Sandi
                                    </label>
                                    <a
                                        href="#"
                                        className="text-xs text-foreground/50 hover:text-gold hover:underline transition-colors font-body"
                                    >
                                        Lupa Kata Sandi?
                                    </a>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
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
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember me Checkbox */}
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-foreground/20 text-gold focus:ring-gold accent-gold cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-foreground/75 font-body cursor-pointer select-none">
                                    Tetap masuk selama 30 hari
                                </label>
                            </div>

                            {/* Submit Button */}
                            <motion.div {...fadeUp(0.8)} className="pt-2">
                                <button
                                    id="login-submit"
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
                                            Masuk
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.form>

                        {/* Divider ATAU */}
                        <motion.div {...fadeUp(0.9)} className="flex items-center my-6 gap-3">
                            <div className="flex-1 border-t border-foreground/10"></div>
                            <span className="text-xs text-foreground/45 uppercase tracking-wider font-body">atau</span>
                            <div className="flex-1 border-t border-foreground/10"></div>
                        </motion.div>

                        {/* Google Login Only */}
                        <motion.div {...fadeUp(1.0)}>
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 transition-all text-xs sm:text-sm font-medium text-foreground/80 cursor-pointer shadow-sm"
                            >
                                <img src="/google-logo.png" alt="Google" className="h-4 w-4 shrink-0 object-contain" />
                                Masuk dengan Google
                            </button>
                        </motion.div>

                        {/* Footer Link */}
                        <motion.p
                            {...fadeUp(1.1)}
                            className="text-center text-xs sm:text-sm text-foreground/50 mt-6 font-body"
                        >
                            Belum punya akun?{' '}
                            <a
                                href="#"
                                className="text-gold hover:underline font-semibold transition-colors"
                            >
                                Daftar sekarang
                            </a>
                        </motion.p>
                    </div>
                </div>
            </div>
        </>
    );
}
