import { Link, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';
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
        <div
            className="min-h-screen flex flex-col font-sans selection:bg-[#F6C343] selection:text-gray-900"
            style={{ backgroundColor: '#F5F7FC', fontFamily: "'Poppins', sans-serif" }}
        >
            {/* Top Navigation Bar Container */}
            <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <header className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                    {/* Brand Logo & Name */}
                    <Link href="/customer/dashboard" className="flex items-center gap-3 shrink-0 group">
                        <div
                            className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
                            style={{ width: 38, height: 38 }}
                        >
                            <img
                                src="/logo.png"
                                alt="GTD Logo"
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                        </div>
                        <span className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap group-hover:text-yellow-600 transition-colors">
                            Global Trans Djaya
                        </span>
                    </Link>

                    {/* Inline Horizontal Menu Tabs */}
                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navLinks.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative py-1.5 text-sm font-medium transition-colors select-none ${
                                        active
                                            ? 'text-gray-900 font-semibold'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {active && (
                                        <span
                                            className="absolute -bottom-1.5 left-0 w-full h-[2.5px] rounded-full animate-in fade-in"
                                            style={{ backgroundColor: '#F6C343' }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Search, Notification & User Avatar */}
                    <div className="flex items-center gap-3">
                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center">
                            <div
                                className="flex items-center gap-2 rounded-full px-3.5 transition-all duration-150 focus-within:ring-2 focus-within:ring-yellow-300"
                                style={{
                                    width: '210px',
                                    height: '38px',
                                    backgroundColor: '#F5F5F5',
                                }}
                            >
                                <Search size={16} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none"
                                />
                            </div>
                        </form>

                        {/* Notification Bell with Badge */}
                        <div className="relative">
                            <button
                                type="button"
                                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 cursor-pointer"
                                title="Notifikasi"
                            >
                                <Bell size={18} className="text-gray-500" strokeWidth={1.8} />
                                <span
                                    className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full text-[10px] font-bold text-gray-900 leading-none shadow-xs"
                                    style={{
                                        minWidth: '16px',
                                        height: '16px',
                                        backgroundColor: '#F6C343',
                                        padding: '0 3px',
                                    }}
                                >
                                    3
                                </span>
                            </button>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 cursor-pointer group"
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1a1a2e&color=F6C343&bold=true&size=100`}
                                    alt={user?.name ?? 'Customer'}
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-yellow-200 group-hover:ring-yellow-400 transition-all duration-150"
                                />
                                <div className="hidden xl:flex flex-col text-left leading-tight">
                                    <span className="text-xs font-semibold text-gray-800 truncate max-w-[130px]">
                                        {companyName}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                        Customer Portal
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-gray-100 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                                            <Building2 size={14} style={{ color: '#F6C343' }} />
                                            <span className="truncate">{companyName}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1 truncate">User: {user?.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
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
                <div className="md:hidden flex items-center justify-around bg-white rounded-2xl border border-gray-100 mt-2 py-2 px-3 shadow-sm">
                    {navLinks.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                                    active
                                        ? 'text-gray-900 font-semibold shadow-xs'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                                style={{
                                    backgroundColor: active ? '#F6C343' : undefined,
                                }}
                            >
                                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
                        <span>✅ {flash.success}</span>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-xs font-medium flex items-center justify-between shadow-xs">
                        <span>❌ {flash.error}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur-xs py-4 text-center text-xs text-gray-400 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="font-semibold text-gray-700">GTD MoveLog</span>
                        <span>•</span>
                        <span>Sistem Pelacakan Kargo Resmi</span>
                    </div>
                    <p>© {new Date().getFullYear()} PT Global Trans Djaya. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
