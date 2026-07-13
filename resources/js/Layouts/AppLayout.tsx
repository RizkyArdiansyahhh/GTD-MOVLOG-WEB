import { Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import type { PageProps } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/shipments', label: 'Shipments', icon: '📦' },
    { href: '/drivers', label: 'Drivers', icon: '🚛' },
    { href: '/reports', label: 'Reports', icon: '📈' },
];

export default function AppLayout({ children, title }: AppLayoutProps) {
    const { auth, flash } = usePage<PageProps>().props;

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
                            LMS
                        </div>
                        <span className="font-semibold text-white">Logistics MS</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 text-sm font-medium"
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.name)}&background=6366f1&color=fff`}
                            alt={auth.user.name}
                            className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{auth.user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{auth.user.roles[0]}</p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="text-slate-400 hover:text-white transition-colors text-xs"
                        >
                            Exit
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
                    <h1 className="text-lg font-semibold text-white">{title}</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        ❌ {flash.error}
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
