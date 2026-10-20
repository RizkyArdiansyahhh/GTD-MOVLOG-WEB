import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import Toast from '@/Components/Toast';

interface AuthLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
}

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
    return (
        <div className="app-ui ui-auth-layout">
            <Toast />
            <header className="ui-auth-header">
                <Link href="/login" className="inline-flex items-center gap-3">
                    <img src="/logo.png" alt="Global Trans Djaya" className="h-9 w-9 object-contain" />
                    <div>
                        <p className="text-sm font-semibold text-brand-navy-dark">GTD MoveLog</p>
                        <p className="text-xs text-slate-600">Global Trans Djaya</p>
                    </div>
                </Link>
            </header>
            <main className="ui-auth-main">
                <div className="ui-auth-form">
                    <h1 className="ui-page-title">{title}</h1>
                    <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">{description}</p>
                    {children}
                </div>
            </main>
            <footer className="px-4 py-5 text-center text-xs text-slate-600">
                &copy; {new Date().getFullYear()} Global Trans Djaya. All rights reserved.
            </footer>
        </div>
    );
}
