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
} from 'lucide-react';


// ─────────────────────────────────────────────
// Menu definition
// ─────────────────────────────────────────────
interface MenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

// Module-level constant – defined once, not re-created on every render
const menuItems: MenuItem[] = [
    { label: 'Dashboard',             href: '/',                  icon: LayoutDashboard },
    { label: 'Kelola Akun',           href: '/kelola-akun',       icon: Users },
    { label: 'Monitoring Barang',     href: '/monitoring-barang', icon: PackageSearch },
    { label: 'Monitoring Checkpoint', href: '/monitoring-cp',     icon: MapPin },
    { label: 'Kelola Sesi Pekerja',   href: '/sesi-pekerja',      icon: ClipboardList },
    { label: 'Submit Dokumen',        href: '/submit-dokumen',    icon: FileUp },
    { label: 'Verifikasi Berkas',     href: '/verifikasi-berkas', icon: FileCheck2 },
    { label: 'Laporan',               href: '/laporan',           icon: BarChart3 },
];

/** Navbar height – must match the value in Navbar.tsx */
const NAVBAR_HEIGHT = 64;

export default function Sidebar() {
    const { url } = usePage();
    const currentPath = url;

    const isActive = (href: string) => {
        if (href === '/') return currentPath === '/';
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    return (
        <aside
            className="fixed left-4 bottom-4 z-40 flex flex-col"
            style={{
                width: '260px',
                top: `${NAVBAR_HEIGHT + 16}px`, // below navbar + gap
            }}
        >
            <div
                className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm"
                style={{ padding: '20px 16px' }}
            >
                {/* ── Navigation ── */}
                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
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
        </aside>
    );
}
