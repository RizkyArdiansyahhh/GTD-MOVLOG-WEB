import { useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bell, Menu, UserRound, LogOut, ChevronDown, Shield, Calendar, CheckCheck, FileCheck, FileX, ClipboardList, UserCheck, MapPin } from 'lucide-react';
import axios from 'axios';
import type { PageProps, CustomerNotificationItem } from '@/types';
import GlobalSearchBar from '@/Components/GlobalSearch/GlobalSearchBar';

interface NavbarProps {
    onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const { auth, notifications } = usePage<PageProps>().props;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Notification states (backend-driven via shared Inertia props —
    // same lifecycle as the customer portal bell).
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(notifications?.unread_count ?? 0);
    const [notificationList, setNotificationList] = useState<CustomerNotificationItem[]>(
        notifications?.latest ?? []
    );
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    const [imageError, setImageError] = useState(false);
    const user = auth?.user;
    // Retry loading the avatar whenever the URL changes (e.g. right after
    // the user uploads a new photo). Without this, a previous 404 keeps
    // `imageError=true` forever and the new photo never appears.
    useEffect(() => {
        setImageError(false);
    }, [user?.avatar_url]);
    const rawRole = user?.roles?.[0] ?? 'User';
    const formattedRole = typeof rawRole === 'string'
        ? rawRole.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'User';

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formattedDate = new Date().toLocaleDateString('en-US', {
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
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
                setNotifOpen(false);
            }
        };

        if (dropdownOpen || notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen, notifOpen]);

    // Sync notification props when updated (every Inertia navigation
    // re-shares them from the database — no polling needed).
    useEffect(() => {
        if (notifications) {
            setUnreadCount(notifications.unread_count);
            setNotificationList(notifications.latest);
        }
    }, [notifications]);

    // Handle marking a single notification as read & navigating.
    // Opening the dropdown alone never marks anything as read.
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
                await axios.post(`/notifications/${item.id}/read`);
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
            await axios.post('/notifications/read-all');
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    // Notification Type Icon Helper
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'document_submitted':
                return <ClipboardList size={15} className="text-amber-600 shrink-0" strokeWidth={1.8} />;
            case 'document_rejected':
                return <FileX size={15} className="text-red-600 shrink-0" strokeWidth={1.8} />;
            case 'session_ready':
                return <FileCheck size={15} className="text-emerald-600 shrink-0" strokeWidth={1.8} />;
            case 'stage_assigned':
                return <UserCheck size={15} className="text-blue-600 shrink-0" strokeWidth={1.8} />;
            case 'stage_completed':
                return <MapPin size={15} className="text-amber-600 shrink-0" strokeWidth={1.8} />;
            default:
                return <Bell size={15} className="text-slate-500 shrink-0" strokeWidth={1.8} />;
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
            {/* -- Left Section: Mobile Toggle & Dynamic Greeting -- */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                    aria-label="Toggle Navigation Menu"
                >
                    <Menu size={20} className="text-slate-700" />
                </button>

                <div className="flex flex-col min-w-0">
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                        {getGreeting()},{' '}
                        <span className="font-semibold text-slate-700">
                            {user?.name?.split(' ')[0] || 'User'}
                        </span>
                    </h1>
                    <p className="hidden md:block text-[11px] text-slate-400 font-medium leading-none mt-0.5 truncate">
                        GTD Activity & Logistics Summary
                    </p>
                </div>
            </div>

            {/* -- Right Section: Search, Date, Notifications, Profile -- */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Date Pill */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{formattedDate}</span>
                </div>

                {/* Global Search Bar */}
                <GlobalSearchBar />

                {/* Notification Bell Dropdown Container */}
                <div className="relative" ref={notifDropdownRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            setDropdownOpen(false);
                        }}
                        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        title="System Notifications"
                        aria-label="Notifications"
                        aria-expanded={notifOpen}
                    >
                        <Bell size={18} strokeWidth={1.8} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-slate-900 bg-amber-400 ring-2 ring-white">
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
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F6C343]/20 text-amber-800 border border-[#F6C343]/40">
                                            {unreadCount} new
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
                                        <span>Mark all as read</span>
                                    </button>
                                )}
                            </div>

                            {/* Notification Items List */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                {notificationList.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <Bell size={24} className="mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                                        <p className="text-xs font-medium text-slate-600">
                                            No notifications yet
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Document and shipment updates for your team will appear here.
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
                                                        title="Unread"
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
                                    href="/monitoring-barang"
                                    onClick={() => setNotifOpen(false)}
                                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors block py-1"
                                >
                                    View All Monitoring →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setDropdownOpen((prev) => !prev);
                                setNotifOpen(false);
                            }}
                        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer group"
                        aria-label="User profile menu"
                        aria-expanded={dropdownOpen}
                    >
                        {user?.avatar_url && !imageError ? (
                            <img
                                src={user.avatar_url}
                                alt={user?.name || 'User'}
                                onError={() => setImageError(true)}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-amber-300 group-hover:ring-amber-400 transition-all duration-150"
                            />
                        ) : (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400 text-[#06283A] font-bold flex items-center justify-center text-xs ring-2 ring-amber-300 group-hover:ring-amber-400 transition-all duration-150 shadow-sm">
                                {getInitials(user?.name)}
                            </div>
                        )}
                        <div className="hidden sm:block text-left leading-tight">
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                                {user?.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium capitalize truncate">
                                {formattedRole}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer mb-0.5"
                            >
                                <UserRound size={16} className="text-slate-400 shrink-0" strokeWidth={1.8} />
                                <span>Edit Profile</span>
                            </Link>

                            <div className="my-1 border-t border-slate-100" />

                            {/* Logout Option - Neutral Soft Gray Style (bukan merah pekat) */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
                            >
                                <LogOut size={16} className="text-slate-400 shrink-0" strokeWidth={1.8} />
                                <span>Sign Out</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
