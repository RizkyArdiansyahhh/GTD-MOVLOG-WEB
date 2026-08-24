import { Link, usePage } from '@inertiajs/react';
import { type ReactNode, useState, useEffect } from 'react';
import {
    LayoutDashboard,
    PackageSearch,
    MapPin,
    LogOut,
    Bell,
    Search,
    ChevronDown,
    Building2,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface CustomerLayoutProps {
    children: ReactNode;
    title?: string;
}

const navLinks = [
    { href: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customer/monitoring-barang', label: 'Monitoring Barang', icon: PackageSearch },
    { href: '/customer/checkpoints', label: 'Checkpoint', icon: MapPin },
];

export default function CustomerLayout({ children, title }: CustomerLayoutProps) {
    const { props, url } = usePage<PageProps>();
    const { auth, flash } = props;
    const [profileOpen, setProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const user = auth?.user;
    const companyName = user?.customer?.company_name ?? user?.name ?? 'Customer GTD';

    const isActive = (href: string) => {
        if (!url) return false;
        if (href === '/customer/dashboard') return url === '/customer/dashboard' || url === '/customer' || url === '/';
        return url.startsWith(href);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/customer/monitoring-barang?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <div className="min-h-screen bg-[#f3f5f8] text-slate-800 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
            {/* Top Navigation Bar Container */}
            <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <header className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                    {/* Brand Logo & Name */}
                    <Link href="/customer/dashboard" className="flex items-center gap-3 shrink-0 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <span className="font-black text-slate-950 text-base tracking-tight">GTD</span>
                        </div>
                        <div>
                            <h1 className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-amber-600 transition-colors">
                                Global Trans Djaya
                            </h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                                Portal Tracking
                            </p>
                        </div>
                    </Link>

                    {/* Inline Horizontal Menu Tabs */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative py-2 text-xs font-bold transition-colors ${
                                        active
                                            ? 'text-amber-600'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {active && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-amber-500 rounded-full animate-in fade-in" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Search, Notification & User Avatar */}
                    <div className="flex items-center gap-3">
                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
                            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="pl-8 pr-3 py-1.5 w-44 xl:w-52 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                            />
                        </form>

                        {/* Notification Bell with Badge */}
                        <div className="relative">
                            <button
                                type="button"
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors relative"
                                title="Notifikasi"
                            >
                                <Bell size={15} />
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                                    3
                                </span>
                            </button>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0f1d2e&color=ffffff&bold=true&size=100`}
                                    alt={user?.name ?? 'Customer'}
                                    className="w-8 h-8 rounded-full ring-2 ring-slate-200"
                                />
                                <div className="hidden xl:flex flex-col text-left">
                                    <span className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
                                        {companyName}
                                    </span>
                                </div>
                                <ChevronDown size={12} className="text-slate-400" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                            <Building2 size={13} className="text-amber-500" />
                                            <span className="truncate">{companyName}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 truncate">User: {user?.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <LogOut size={14} />
                                        <span>Keluar (Logout)</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Sub-Navigation Bar */}
                <div className="md:hidden flex items-center justify-around bg-white rounded-xl border border-slate-200/80 mt-2 py-2 px-3 shadow-xs">
                    {navLinks.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                                    active
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <span>✅ {flash.success}</span>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <span>❌ {flash.error}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="font-bold text-slate-700">GTD MoveLog</span>
                        <span>•</span>
                        <span>Sistem Pelacakan Kargo Resmi</span>
                    </div>
                    <p>© {new Date().getFullYear()} PT Global Trans Djaya. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
