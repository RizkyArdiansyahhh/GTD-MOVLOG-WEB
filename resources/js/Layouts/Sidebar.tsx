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
    FileSpreadsheet,
    LifeBuoy,
    BookOpen,
    X,
    ChevronLeft,
    ChevronRight,
    Headphones,
} from 'lucide-react';
import type { PageProps } from '@/types';

// ---------------------------------------------
// Menu definition & Types (English Labels)
// ---------------------------------------------
interface MenuItem {
    label: string;
    href: string;
    routeName?: string;
    icon: React.ElementType;
    badge?: string | number;
    roles?: string[];
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const menuSections: MenuSection[] = [
    {
        title: 'Main Menu',
        items: [
            { label: 'Dashboard', href: '/', routeName: 'dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Worker Sessions', href: '/sesi-pekerja', routeName: 'kelola-sesi', icon: ClipboardList, roles: ['super-admin'] },
            { label: 'Cargo Monitoring', href: '/monitoring-barang', icon: PackageSearch },
            { label: 'Checkpoint Monitoring', href: '/monitoring-checkpoint', icon: MapPin },
        ],
    },
    {
        title: 'Documents & Reports',
        items: [
            { label: 'Submit Documents', href: '/submit-berkas', routeName: 'submit-berkas.index', icon: FileUp, roles: ['super-admin', 'staff'] },
            { label: 'Verify Documents', href: '/verifikasi-berkas', routeName: 'verifikasi-berkas', icon: FileCheck2, roles: ['supervisor'] },
            { label: 'Reports', href: '/laporan', icon: BarChart3 },
        ],
    },
    {
        title: 'Configuration',
        items: [
            { label: 'Report Templates', href: '/template-laporan', routeName: 'template-laporan.index', icon: FileSpreadsheet, roles: ['super-admin'] },
            { label: 'Account Management', href: '/kelola-akun', routeName: 'kelola-akun', icon: Users, roles: ['super-admin'] },
        ],
    },
    {
        title: 'Support',
        items: [
            { label: 'Help Center', href: '/pusat-bantuan', routeName: 'pusat-bantuan', icon: LifeBuoy },
            { label: 'System Guide', href: '/panduan', routeName: 'panduan', icon: BookOpen },
        ],
    },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({
    isOpen = false,
    onClose,
    isCollapsed = false,
    onToggleCollapse,
}: SidebarProps) {
    const page = usePage<PageProps>();
    const currentPath = page.url;
    const authUser = page.props.auth?.user;

    // Get active user roles (normalized to lowercase)
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

    // Render inner sidebar content
    const renderSidebarInner = (collapsed: boolean) => (
        <div className="flex flex-col h-full bg-white select-none relative">
            {/* -- Brand Header (Logo polos tanpa box) -- */}
            <div className={`h-16 flex items-center justify-between border-b border-gray-100 shrink-0 ${
                collapsed ? 'px-3 justify-center' : 'px-4'
            }`}>
                <Link href="/" className="flex items-center gap-3 group min-w-0">
                    <img
                        src="/logo.png"
                        alt="GTD Logo"
                        className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform duration-150"
                    />

                    {!collapsed && (
                        <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-bold text-gray-900 text-sm tracking-tight truncate group-hover:text-slate-700 transition-colors">
                                GTD Logistics
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium truncate">
                                Logistics MS
                            </span>
                        </div>
                    )}
                </Link>

                {/* Collapse / Expand Toggle Button */}
                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className={`hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors ${
                            collapsed ? 'mx-auto mt-1' : ''
                        }`}
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                )}

                {/* Mobile Close Button */}
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Close Menu"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* -- Categorized Menu List -- */}
            <nav className={`flex-1 overflow-y-auto py-4 space-y-4 ${collapsed ? 'px-2' : 'px-3'}`}>
                {menuSections.map((section, idx) => {
                    const validItems = section.items.filter((item) => {
                        if (!item.roles || item.roles.length === 0) return true;
                        const allowed = item.roles.map((r) => r.toLowerCase());
                        return allowed.some((role) => userRoles.includes(role));
                    });

                    if (validItems.length === 0) return null;

                    return (
                        <div key={section.title || idx} className="space-y-1">
                            {!collapsed && section.title && (
                                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                    {section.title}
                                </p>
                            )}
                            {collapsed && idx > 0 && (
                                <div className="my-2 border-t border-gray-100 mx-2" />
                            )}

                            {validItems.map((item) => {
                                const targetHref = getItemHref(item);
                                const active = isActive(item.href) || (targetHref !== item.href && isActive(targetHref));
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={targetHref}
                                        onClick={() => { if (onClose) onClose(); }}
                                        title={collapsed ? item.label : undefined}
                                        className={`group relative flex items-center ${
                                            collapsed ? 'justify-center px-0 py-2.5 rounded-xl' : 'justify-between px-3 py-2.5 rounded-xl'
                                        } text-xs font-semibold transition-all duration-150 ${
                                            active
                                                ? 'bg-[#0F172A] text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                                        }`}
                                    >
                                        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
                                            <Icon
                                                size={19}
                                                strokeWidth={active ? 2.0 : 1.8}
                                                className={
                                                    active
                                                        ? 'text-white shrink-0'
                                                        : 'text-gray-400 group-hover:text-gray-700 shrink-0 transition-colors'
                                                }
                                            />
                                            {!collapsed && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                        </div>

                                        {!collapsed && item.badge && (
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                active ? 'bg-amber-400 text-gray-900' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* -- Bottom Sidebar Card: Support GTD -- */}
            <div className={`p-3 border-t border-gray-100 shrink-0 bg-gray-50/50 ${collapsed ? 'px-2' : 'px-3'}`}>
                {!collapsed ? (
                    <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Headphones size={16} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 leading-tight">
                            <span className="text-xs font-bold text-gray-900 truncate">GTD Support</span>
                            <span className="text-[10px] text-gray-500 truncate">24/7 Assistance</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center py-1 text-gray-400" title="GTD Support 24/7">
                        <Headphones size={18} strokeWidth={1.8} />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* -- Desktop Sidebar -- */}
            <aside
                className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col border-r border-gray-200/80 bg-white transition-all duration-200 ${
                    isCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                {renderSidebarInner(isCollapsed)}
            </aside>

            {/* -- Mobile Drawer -- */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
                        onClick={onClose}
                    />
                    <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
                        {renderSidebarInner(false)}
                    </aside>
                </div>
            )}
        </>
    );
}
