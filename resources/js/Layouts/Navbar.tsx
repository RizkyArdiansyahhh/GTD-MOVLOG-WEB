import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Menu, UserRound, LogOut, ChevronDown, Shield } from 'lucide-react';
import type { PageProps } from '@/types';
import GlobalSearchBar from '@/Components/GlobalSearch/GlobalSearchBar';

// ---------------------------------------------
// Notification badge count (mock – swap with real prop)
// ---------------------------------------------
const NOTIFICATION_COUNT = 3;

interface NavbarProps {
    onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const { auth } = usePage<PageProps>().props;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const user = auth?.user;
    const rawRole = user?.roles?.[0] ?? 'User';
    const formattedRole = typeof rawRole === 'string'
        ? rawRole.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'User';

    const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=F6C343&color=1a1a1a&bold=true&size=128`;

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    return (
        <header
            className="fixed top-3 left-3 right-3 lg:top-4 lg:left-4 lg:right-4 z-50 flex items-center bg-white rounded-2xl border border-gray-100 shadow-sm"
            style={{ height: '64px', padding: '0 20px' }}
        >
            {/* -- Left side – Hamburger + Logo & Brand -- */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Hamburger button (mobile/tablet only) */}
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    aria-label="Toggle menu"
                >
                    <Menu size={22} className="text-gray-600" strokeWidth={2} />
                </button>

                <div
                    className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
                    style={{ width: 38, height: 38 }}
                >
                    <img
                        src="/logo.png"
                        alt="GTD Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <span className="font-bold text-gray-900 text-sm whitespace-nowrap hidden sm:inline">Global Trans Djaya</span>
            </div>

            {/* -- Spacer -- */}
            <div className="flex-1" />

            {/* -- Right side -- */}
            <div className="flex items-center gap-4">
                {/* Global Search Bar (Responsive with Dropdown & Shortcuts) */}
                <GlobalSearchBar />

                {/* Notification bell */}
                <button
                    type="button"
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    aria-label="Notifications"
                >
                    <Bell size={20} className="text-gray-500" strokeWidth={1.8} />
                    {NOTIFICATION_COUNT > 0 && (
                        <span
                            className="absolute top-1 right-1 flex items-center justify-center rounded-full text-[10px] font-bold text-gray-900 leading-none"
                            style={{
                                minWidth: '16px',
                                height: '16px',
                                backgroundColor: '#F6C343',
                                padding: '0 3px',
                            }}
                        >
                            {NOTIFICATION_COUNT > 9 ? '9+' : NOTIFICATION_COUNT}
                        </span>
                    )}
                </button>

                {/* Avatar & Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 cursor-pointer group"
                        aria-label="User profile menu"
                        aria-expanded={dropdownOpen}
                    >
                        <img
                            src={avatarUrl}
                            alt={user?.name || 'User'}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-yellow-200 group-hover:ring-yellow-400 transition-all duration-150"
                        />
                        <div className="hidden sm:block text-left leading-tight">
                            <p className="text-sm font-semibold text-gray-800 leading-snug truncate max-w-[140px]">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-400 capitalize leading-snug">
                                {formattedRole}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* User Header */}
                            <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                    {user?.email}
                                </p>
                                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-400/20 text-gray-900 border border-yellow-400/40">
                                    <Shield size={11} className="text-yellow-700" strokeWidth={2.2} />
                                    <span>{formattedRole}</span>
                                </div>
                            </div>

                            {/* Edit Profil Link */}
                            <Link
                                href="/profil"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer mb-0.5"
                            >
                                <UserRound size={15} className="text-gray-500 shrink-0" strokeWidth={1.8} />
                                <span>Edit Profil</span>
                            </Link>

                            {/* Divider */}
                            <div className="my-1 border-t border-gray-100" />

                            {/* Logout Option */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <LogOut size={15} className="text-red-500 shrink-0" strokeWidth={1.8} />
                                <span>Logout</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
