import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { FormEventHandler } from 'react';
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

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });
    const { flash } = usePage<{ flash?: { success?: string } }>().props;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password" />
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
                                Reset Your Password Securely.
                            </motion.h2>
                            <motion.p
                                {...fadeUp(0.6)}
                                className="text-white/60 font-body text-sm xl:text-base leading-relaxed"
                            >
                                Enter your account email and we will send you a secure reset link valid for 60 minutes.
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
                                <BlurText text="Forgot Password" delay={0.3} />
                            </h1>
                            <motion.p
                                {...fadeUp(0.4)}
                                className="text-foreground/50 text-xs sm:text-sm font-body"
                            >
                                Enter your account email to receive a reset link.
                            </motion.p>
                        </div>

                        {flash?.success && (
                            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800 font-body">
                                {flash.success}
                            </div>
                        )}

                        <motion.form
                            onSubmit={submit}
                            {...fadeUp(0.6)}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="forgot-email"
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
                                        id="forgot-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="name@company.com"
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

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 rounded-lg bg-foreground text-white text-sm font-semibold font-body hover:bg-foreground/90 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                {processing ? 'Sending…' : 'Send Reset Link'}
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
