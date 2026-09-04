import { Link, usePage, router } from '@inertiajs/react';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    PackageSearch,
    MapPin,
    LogOut,
    Search,
    ChevronDown,
    Building2,
    CheckCircle,
    AlertCircle,
    X,
    Bell,
    UserRound,
    CheckCheck,
    FileCheck,
    Truck,
} from 'lucide-react';
import Toast from '@/Components/Toast';
import type { PageProps, CustomerNotificationItem } from '@/types';

interface CustomerLayoutProps {
    children: ReactNode;
    title?: string;
}

const navLinks = [
    { href: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customer/monitoring-barang', label: 'Cargo Monitoring', icon: PackageSearch },
    { href: '/customer/checkpoints', label: 'Checkpoint', icon: MapPin },
];

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const { props, url } = usePage<PageProps>();
    const { auth, notifications, flash } = props;

    // Dropdown states
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFlash, setShowFlash] = useState(true);

    // Notification states
    const [unreadCount, setUnreadCount] = useState<number>(notifications?.unread_count ?? 0);
    const [notificationList, setNotificationList] = useState<CustomerNotificationItem[]>(
        notifications?.latest ?? []
    );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    const [imageError, setImageError] = useState(false);
    const user = auth?.user;
    const companyName = user?.customer?.company_name ?? user?.name ?? 'Customer';

    const getInitials = (name?: string) => {
        if (!name) return 'C';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    // Sync notification props when updated
    useEffect(() => {
        if (notifications) {
            setUnreadCount(notifications.unread_count);
            setNotificationList(notifications.latest);
        }
    }, [notifications]);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setProfileOpen(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
                setNotifOpen(false);
            }
        };

        if (profileOpen || notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [profileOpen, notifOpen]);

    const isActive = (href: string) => {
        if (!url) return false;
        if (href === '/customer/dashboard') {
            return url === '/customer/dashboard' || url === '/customer' || url === '/';
        }
        return url.startsWith(href);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.get(
                '/customer/monitoring-barang',
                { search: searchQuery.trim() },
                { preserveState: true }
            );
        }
    };

    // Handle marking a single notification as read & navigating
    const handleNotificationClick = async (item: CustomerNotificationItem) => {
        if (!item.read_at) {
            // Optimistic update
            setNotificationList((prev) =>
                prev.map((n) =>
                    n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            try {
                await axios.post(`/customer/notifications/${item.id}/read`);
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        setNotifOpen(false);
        if (item.url) {
            router.visit(item.url);
        }
    };

    // Handle marking all notifications as read
    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        // Optimistic update
        setNotificationList((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        setUnreadCount(0);

        try {
            await axios.post('/customer/notifications/read-all');
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    // Notification Type Icon Helper
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'shipment_stage_updated':
                return <MapPin size={15} className="text-yellow-600 shrink-0" strokeWidth={1.8} />;
            case 'document_verified':
                return <FileCheck size={15} className="text-emerald-600 shrink-0" strokeWidth={1.8} />;
            case 'shipment_completed':
                return <Truck size={15} className="text-blue-600 shrink-0" strokeWidth={1.8} />;
            default:
                return <Bell size={15} className="text-slate-500 shrink-0" strokeWidth={1.8} />;
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col font-sans bg-[#F5F7FC] text-slate-800 antialiased selection:bg-[#F6C343] selection:text-slate-900"
            style={{
                backgroundColor: '#F5F7FC',
                fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            {/* Global Toast Notifications */}
            <Toast />

            {/* Top Navigation Bar Container */}
            <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <header className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                    {/* Brand Logo & Name */}
                    <Link href="/customer/dashboard" className="flex items-center gap-3 shrink-0 group">
                        <div
                            className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
                            style={{ width: 40, height: 40 }}
                        >
                            <img
                                src="/logo.png"
                                alt="GTD Logo"
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-[#06283A] text-sm sm:text-base leading-tight whitespace-nowrap">
                                Global Trans Djaya
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                                Customer Portal
                            </span>
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
                                    className={`relative py-1 text-xs sm:text-sm font-semibold transition-colors select-none ${
                                        active
                                            ? 'text-[#06283A] font-bold'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {active && (
                                        <span
                                            className="absolute -bottom-1.5 left-0 w-full h-[3px] rounded-full"
                                            style={{ backgroundColor: '#F6C343' }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Search & User Avatar */}
                    <div className="flex items-center gap-3">
                        {/* Quick Search */}
                        <form onSubmit={handleSearch} className="hidden lg:flex items-center">
                            <div className="flex items-center gap-2 rounded-full px-3.5 bg-slate-100/90 border border-slate-200 focus-within:ring-2 focus-within:ring-yellow-400 focus-within:bg-white transition-all w-52 h-9">
                                <Search size={14} className="text-slate-400 shrink-0" strokeWidth={2} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
                                />
                            </div>
                        </form>

                        {/* Notification Bell Dropdown Container */}
                        <div className="relative" ref={notifDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setNotifOpen(!notifOpen);
                                    setProfileOpen(false);
                                }}
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                                title="Notifikasi Sistem"
                                aria-label="Notifikasi"
                            >
                                <Bell size={16} strokeWidth={1.8} />
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full font-bold text-[10px] border border-white shadow-xs leading-none flex items-center justify-center animate-in zoom-in"
                                        style={{ backgroundColor: '#F6C343', color: '#06283A' }}
                                    >
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown Panel */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* Dropdown Header */}
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#06283A]">
                                                Notifikasi
                                            </span>
                                            {unreadCount > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-yellow-400/20 text-yellow-800 border border-yellow-400/40">
                                                    {unreadCount} baru
                                                </span>
                                            )}
                                        </div>

                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleMarkAllAsRead}
                                                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                            >
                                                <CheckCheck size={13} strokeWidth={2} />
                                                <span>Tandai semua dibaca</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification Items List */}
                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                        {notificationList.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400">
                                                <Bell size={24} className="mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                                                <p className="text-xs font-medium text-slate-600">
                                                    Belum ada notifikasi
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Your cargo and document updates will appear here.
                                                </p>
                                            </div>
                                        ) : (
                                            notificationList.map((item) => {
                                                const isUnread = !item.read_at;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleNotificationClick(item)}
                                                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                                                            isUnread ? 'bg-amber-50/30' : 'bg-white'
                                                        }`}
                                                    >
                                                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100/80 border border-slate-200/60">
                                                            {getNotificationIcon(item.type)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p
                                                                className={`text-xs leading-snug line-clamp-2 ${
                                                                    isUnread
                                                                        ? 'font-bold text-[#06283A]'
                                                                        : 'font-medium text-slate-700'
                                                                }`}
                                                            >
                                                                {item.title}
                                                            </p>
                                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                                <span className="text-[10px] text-slate-400 font-normal">
                                                                    {item.created_at_human}
                                                                </span>
                                                                {item.assignment_no && (
                                                                    <span className="text-[10px] font-mono font-semibold text-slate-500 truncate">
                                                                        {item.assignment_no}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isUnread && (
                                                            <span
                                                                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                                                style={{ backgroundColor: '#F6C343' }}
                                                                title="Belum dibaca"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Dropdown Footer */}
                                    <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                                        <Link
                                            href="/customer/monitoring-barang"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors block py-1"
                                        >
                                            Lihat Semua Monitoring Kargo →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setProfileOpen(!profileOpen);
                                    setNotifOpen(false);
                                }}
                                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 cursor-pointer group"
                            >
                                {user?.avatar_url && !imageError ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user?.name ?? 'Customer'}
                                        onError={() => setImageError(true)}
                                        className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-yellow-400 transition-all duration-150"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-slate-900 text-[#F6C343] font-bold flex items-center justify-center text-xs ring-2 ring-slate-200 group-hover:ring-yellow-400 transition-all duration-150 shadow-sm">
                                        {getInitials(companyName)}
                                    </div>
                                )}
                                <div className="hidden xl:flex flex-col text-left leading-tight">
                                    <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                                        {companyName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold truncate">
                                        {user?.customer?.pic_name || user?.name || 'Customer Staff'}
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                            <Building2 size={14} style={{ color: '#F6C343' }} />
                                            <span className="truncate">{companyName}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 mt-1 font-medium truncate">User: {user?.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                    </div>

                                    {/* Edit Profil Menu Option */}
                                    <Link
                                        href="/customer/profil"
                                        onClick={() => setProfileOpen(false)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#06283A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mb-0.5"
                                    >
                                        <UserRound size={15} className="text-slate-500 shrink-0" strokeWidth={1.8} />
                                        <span>Edit Profile</span>
                                    </Link>

                                    {/* Logout Button */}
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <LogOut size={14} strokeWidth={1.8} />
                                        <span>Sign Out</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Navigation Tabs */}
                <div className="md:hidden flex items-center justify-around bg-white rounded-xl border border-slate-200 mt-2 py-2 px-3 shadow-xs">
                    {navLinks.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                                    active
                                        ? 'text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                                style={{
                                    backgroundColor: active ? '#F6C343' : undefined,
                                }}
                            >
                                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Flash Messages (Inline fallback) */}
            {showFlash && flash?.success && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full animate-in fade-in">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                        <button
                            onClick={() => setShowFlash(false)}
                            className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            {showFlash && flash?.error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full animate-in fade-in">
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                        <button
                            onClick={() => setShowFlash(false)}
                            className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-xs py-4 text-center text-xs text-slate-400 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-700">GTD MoveLog</span>
                        <span>•</span>
                        <span>Sistem Pelacakan Kargo Resmi</span>
                    </div>
                    <p>© {new Date().getFullYear()} PT Global Trans Djaya. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
