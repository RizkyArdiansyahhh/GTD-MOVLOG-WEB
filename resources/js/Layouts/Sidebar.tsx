import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    PackageSearch,
    MapPin,
    ClipboardList,
    FileUp,
    FileCheck2,
    BarChart3,
    LogOut,
    X,
} from 'lucide-react';
import type { PageProps } from '@/types';

// ─────────────────────────────────────────────
// Menu definition
// ─────────────────────────────────────────────
interface MenuItem {
    label: string;
    href: string;
    routeName?: string;
    icon: React.ElementType;
    /** If set, the menu only renders when the user has one of these roles */
    roles?: string[];
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/', routeName: 'dashboard', icon: LayoutDashboard },
    { label: 'Kelola Akun', href: '/kelola-akun', routeName: 'kelola-akun', icon: Users, roles: ['super-admin'] },
    { label: 'Monitoring Barang', href: '/monitoring-barang', icon: PackageSearch },
    { label: 'Monitoring Checkpoint', href: '/monitoring-cp', icon: MapPin },
    { label: 'Kelola Sesi Pekerja', href: '/sesi-pekerja', routeName: 'kelola-sesi', icon: ClipboardList, roles: ['super-admin'] },
    { label: 'Submit Dokumen', href: '/submit-berkas', routeName: 'submit-berkas.index', icon: FileUp, roles: ['super-admin', 'staff'] },
    { label: 'Verifikasi Dokumen', href: '/verifikasi-berkas', routeName: 'verifikasi-berkas', icon: FileCheck2, roles: ['super-admin', 'supervisor'] },
    { label: 'Laporan', href: '/laporan', icon: BarChart3 },
];

/** Navbar height – must match the value in Navbar.tsx */
const NAVBAR_HEIGHT = 64;

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const page = usePage<PageProps>();
    const currentPath = page.url;
    const authUser = page.props.auth?.user;

    // Get active user roles (normalized to lowercase) without dummy fallback
    const userRoles = useMemo(() => {
        if (!authUser?.roles) {
            return [];
        }
        const rolesArray = Array.isArray(authUser.roles)
            ? authUser.roles
            : Array.from(authUser.roles as any);

        return rolesArray.map((r: any) =>
            (typeof r === 'string' ? r : r?.name || String(r)).toLowerCase()
        );
    }, [authUser]);

    const getItemHref = (item: MenuItem): string => {
        if (item.routeName && typeof (window as any).route === 'function') {
            try {
                return (window as any).route(item.routeName);
            } catch {
                return item.href;
            }
        }
        return item.href;
    };

    const isActive = (href: string) => {
        if (href === '/') return currentPath === '/';
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    // Shared sidebar content rendered in both desktop and mobile modes
    const sidebarContent = (
        <div
            className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm"
            style={{ padding: '20px 16px' }}
        >
            {/* ── Close button (mobile only) ── */}
            <div className="flex items-center justify-between mb-2 lg:hidden">
                <span className="text-sm font-bold text-gray-800">Menu</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    aria-label="Tutup menu"
                >
                    <X size={20} className="text-gray-500" strokeWidth={2} />
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {menuItems.map((item) => {
                    // ── Conditional rendering: skip restricted items if role doesn't match ──
                    if (item.roles && item.roles.length > 0) {
                        const allowedRoles = item.roles.map((r) => r.toLowerCase());
                        const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
                        if (!hasPermission) {
                            return null;
                        }
                    }

                    const targetHref = getItemHref(item);
                    const active = isActive(item.href) || (targetHref !== item.href && isActive(targetHref));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={targetHref}
                            onClick={() => { if (onClose) onClose(); }}
                            className={[
                                'flex items-center gap-3 px-3 rounded-lg transition-all duration-150 text-sm font-medium select-none',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                                active
                                    ? 'text-gray-900'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
                            ].join(' ')}
                            style={{
                                height: '44px',
                                backgroundColor: active ? '#F6C343' : undefined,
                            }}
                        >
                            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Divider ── */}
            <div className="my-4 h-px bg-gray-100" />

            {/* ── Logout ── */}
            <Link
                href="/logout"
                method="post"
                as="button"
                className="flex items-center gap-3 px-3 rounded-lg transition-all duration-150 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                style={{ height: '44px' }}
            >
                <LogOut size={20} strokeWidth={1.8} />
                <span>Logout</span>
            </Link>
        </div>
    );

    return (
        <>
            {/* ── Desktop sidebar (lg+): fixed, always visible ── */}
            <aside
                className="hidden lg:flex fixed left-0 bottom-0 z-40 flex-col"
                style={{
                    width: '276px',
                    top: `${NAVBAR_HEIGHT}px`,
                    paddingTop: '16px',
                    paddingLeft: '16px',
                    paddingBottom: '16px',
                    backgroundColor: '#F5F7FC',
                }}
            >
                {sidebarContent}
            </aside>

            {/* ── Mobile/Tablet sidebar (< lg): overlay mode ── */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity duration-200"
                        onClick={onClose}
                    />
                    {/* Sidebar panel */}
                    <aside
                        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[280px] bg-white shadow-xl"
                        style={{ padding: '16px' }}
                    >
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}

