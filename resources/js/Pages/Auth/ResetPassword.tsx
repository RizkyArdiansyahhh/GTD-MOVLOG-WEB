import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, type FormEventHandler } from 'react';
import BlurText from './BlurText';
import Toast from '@/Components/Toast';

/* ── Animation helpers (same language as Login) ──────────────────── */
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

interface ResetPasswordProps {
    token: string;
    email: string;
}

const inputClass =
    'w-full pl-11 pr-12 py-2.5 rounded-lg bg-white border border-foreground/10 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all text-sm font-body shadow-sm';

function LockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <>
            <Head title="Reset Password" />
            <Toast />

            {/* Google Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
                rel="stylesheet"
            />

            <div className="min-h-screen flex font-body bg-[#F7F7F5] relative overflow-hidden">
                {/* Mobile background */}
                <div className="absolute inset-0 lg:hidden z-0">
                    <img
                        src="/service-vessel.png"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover blur-[8px] scale-105"
                    />
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                </div>

                {/* LEFT PANEL — Branding (Desktop only) */}
                <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden shrink-0">
                    <img
                        src="/service-vessel.png"
                        alt="Service Vessel"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a2e]/90 via-[#0f1a2e]/85 to-[#0f1a2e]/95" />
                    <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
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
                        <div className="flex-1 flex flex-col justify-center max-w-lg">
                            <motion.h2
                                {...fadeBlurUp(0.4)}
                                className="text-white font-heading font-bold text-3xl xl:text-4xl xl:leading-tight mb-5"
                            >
                                Choose a Strong New Password.
                            </motion.h2>
                            <motion.p
                                {...fadeUp(0.6)}
                                className="text-white/60 font-body text-sm xl:text-base leading-relaxed"
                            >
                                Minimum 8 characters with uppercase, lowercase, numbers, and symbols.
                            </motion.p>
                        </div>
                        <motion.div
                            {...fadeUp(0.8)}
                            className="text-white/30 text-xs"
                        >
                            &copy; {new Date().getFullYear()} GlobalTransDjaya. All rights reserved.
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL — Form */}
                <div className="w-full lg:w-[40%] flex flex-col justify-center items-center z-10 relative px-4 py-8 sm:px-6 lg:px-8 xl:px-12 min-h-screen">
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

                    <div className="w-full max-w-[440px] bg-white/80 sm:bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl sm:shadow-xl sm:border sm:border-black/5 lg:shadow-none lg:border-none">
                        <div className="text-center lg:text-left mb-6">
                            <h1 className="font-heading font-semibold text-foreground text-2xl md:text-3xl leading-tight tracking-[-1px] mb-2">
                                <BlurText text="Reset Password" delay={0.3} />
                            </h1>
                            <motion.p
                                {...fadeUp(0.4)}
                                className="text-foreground/50 text-xs sm:text-sm font-body"
                            >
                                Set a new password for your account.
                            </motion.p>
                        </div>

                        <motion.form
                            onSubmit={submit}
                            {...fadeUp(0.6)}
                            className="space-y-4"
                        >
                            {/* Email (readonly — needed by the broker, nothing else exposed) */}
                            <div>
                                <label
                                    htmlFor="reset-email"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <MailIcon />
                                    </span>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={data.email}
                                        readOnly
                                        autoComplete="email"
                                        className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-100 border border-foreground/10 text-foreground/60 text-sm font-body shadow-sm cursor-not-allowed"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* New password */}
                            <div>
                                <label
                                    htmlFor="reset-password"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    New Password
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <LockIcon />
                                    </span>
                                    <input
                                        id="reset-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className={inputClass}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500 font-body">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirmation */}
                            <div>
                                <label
                                    htmlFor="reset-password-confirmation"
                                    className="block text-xs sm:text-sm font-medium text-foreground/80 mb-1.5 font-body"
                                >
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-foreground/40">
                                        <LockIcon />
                                    </span>
                                    <input
                                        id="reset-password-confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-lg bg-foreground text-white text-sm font-semibold font-body hover:bg-foreground/90 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                {processing ? 'Resetting…' : 'Reset Password'}
                            </button>

                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-xs text-foreground/50 hover:text-gold hover:underline transition-colors font-body"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </motion.form>
                    </div>
                </div>
            </div>
        </>
    );
}
