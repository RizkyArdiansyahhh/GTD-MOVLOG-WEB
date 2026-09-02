import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Menu, UserRound, LogOut, ChevronDown, Shield, Calendar } from 'lucide-react';
import type { PageProps } from '@/types';
import GlobalSearchBar from '@/Components/GlobalSearch/GlobalSearchBar';

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const formattedDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

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
        <header className="sticky top-0 z-30 h-16 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between">
            {/* -- Left Section: Mobile Toggle & Dynamic Greeting -- */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    aria-label="Toggle Navigation Menu"
                >
                    <Menu size={20} className="text-gray-700" />
                </button>

                <div className="flex flex-col min-w-0">
                    <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate">
                        {getGreeting()},{' '}
                        <span className="font-semibold text-gray-700">
                            {user?.name?.split(' ')[0] || 'User'}
                        </span>
                    </h1>
                    <p className="hidden md:block text-[11px] text-gray-400 font-medium leading-none mt-0.5 truncate">
                        Ringkasan aktivitas & sistem logistik GTD
                    </p>
                </div>
            </div>

            {/* -- Right Section: Search, Date, Notifications, Profile -- */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Date Pill */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 border border-gray-200/60 text-xs font-semibold text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formattedDate}</span>
                </div>

                {/* Global Search Bar */}
                <GlobalSearchBar />

                {/* Notification Bell */}
                <button
                    type="button"
                    className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    aria-label="Notifications"
                >
                    <Bell size={18} strokeWidth={1.8} />
                    {NOTIFICATION_COUNT > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-gray-900 bg-amber-400 ring-2 ring-white">
                            {NOTIFICATION_COUNT > 9 ? '9+' : NOTIFICATION_COUNT}
                        </span>
                    )}
                </button>

                {/* User Profile */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer group"
                        aria-label="User profile menu"
                        aria-expanded={dropdownOpen}
                    >
                        <img
                            src={avatarUrl}
                            alt={user?.name || 'User'}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-amber-300 group-hover:ring-amber-400 transition-all duration-150"
                        />
                        <div className="hidden sm:block text-left leading-tight">
                            <p className="text-xs font-bold text-gray-800 truncate max-w-[130px]">
                                {user?.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium capitalize truncate">
                                {formattedRole}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-gray-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                    {user?.email}
                                </p>
                                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-900 border border-amber-400/30">
                                    <Shield size={11} className="text-amber-700" strokeWidth={2.2} />
                                    <span>{formattedRole}</span>
                                </div>
                            </div>

                            <Link
                                href="/profil"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-colors cursor-pointer mb-0.5"
                            >
                                <UserRound size={16} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                                <span>Edit Profil</span>
                            </Link>

                            <div className="my-1 border-t border-gray-100" />

                            {/* Logout Option - Neutral Soft Gray Style (bukan merah pekat) */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-colors cursor-pointer"
                            >
                                <LogOut size={16} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                                <span>Keluar Sistem (Logout)</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
