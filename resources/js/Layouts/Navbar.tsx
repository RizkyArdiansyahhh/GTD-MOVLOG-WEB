import { usePage } from '@inertiajs/react';
import { Search, Bell } from 'lucide-react';
import type { PageProps } from '@/types';

// ─────────────────────────────────────────────
// Notification badge count (mock – swap with real prop)
// ─────────────────────────────────────────────
const NOTIFICATION_COUNT = 3;

export default function Navbar() {
    const { auth } = usePage<PageProps>().props;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.name)}&background=F6C343&color=1a1a1a&bold=true&size=128`;

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center bg-white border-b border-gray-200 shadow-sm"
            style={{ height: '64px', padding: '0 24px' }}
        >
            {/* ── Left side – Logo & Brand ── */}
            <div className="flex items-center gap-3 shrink-0">
                <div
                    className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
                    style={{ width: 40, height: 40 }}
                >
                    <img
                        src="/logo.png"
                        alt="GTD Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <span className="font-bold text-gray-900 text-sm whitespace-nowrap">Global Trans Djaya</span>
            </div>

            {/* ── Spacer ── */}
            <div className="flex-1" />

            {/* ── Right side ── */}
            <div className="flex items-center gap-4">
                {/* Search bar */}
                <div
                    className="flex items-center gap-2 rounded-full px-4 transition-all duration-150 focus-within:ring-2 focus-within:ring-yellow-300"
                    style={{
                        width: '260px',
                        height: '40px',
                        backgroundColor: '#F5F5F5',
                    }}
                >
                    <Search size={18} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                    />
                </div>

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

                {/* Avatar */}
                <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 group"
                    aria-label="Profile"
                >
                    <img
                        src={avatarUrl}
                        alt={auth.user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-yellow-200 group-hover:ring-yellow-400 transition-all duration-150"
                    />
                    <div className="hidden sm:block text-left leading-tight">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">
                            {auth.user.name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize leading-snug">
                            {auth.user.roles?.[0] ?? 'User'}
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
}
