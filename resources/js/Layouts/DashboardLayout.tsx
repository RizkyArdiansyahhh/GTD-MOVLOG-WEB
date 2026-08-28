import { type ReactNode, useState, type CSSProperties } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from '@/Components/Toast';

interface DashboardLayoutProps {
    children: ReactNode;
    /** Optional – kept for backward compat with pages that pass title */
    title?: string;
}

/**
 * DashboardLayout
 *
 * Composed layout for internal users (Admin/Staff):
 *  ┌──────────────────────────────────────────────┐
 *  │ [Navbar – fixed full-width top bar]          │
 *  ├──────────┬───────────────────────────────────┤
 *  │          │                                   │
 *  │ Sidebar  │  <children />                     │
 *  │ (fixed)  │                                   │
 *  │          │                                   │
 *  └──────────┴───────────────────────────────────┘
 *
 * Desktop:
 * - Navbar tetap di bagian atas
 * - Sidebar tetap di sisi kiri
 * - Konten bergeser mengikuti lebar sidebar
 *
 * Mobile/Tablet:
 * - Sidebar dapat dibuka melalui Navbar
 * - Konten menggunakan full width
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div
            className="min-h-screen"
            style={
                {
                    backgroundColor: '#F5F7FC',
                    fontFamily: "'Poppins', sans-serif",
                    '--navbar-h': '64px',
                    '--content-gap': '0px',
                } as CSSProperties
            }
        >
            {/* ── Fixed Navbar (full-width top) ── */}
            <Navbar
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            />

            {/* ── Toast notifications ── */}
            <Toast />

            {/* ── Fixed Sidebar (below navbar) ── */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── Main content area ── */}
            <main
                className="flex-1 relative overflow-hidden ml-0 lg:ml-[292px] px-4 lg:px-0 lg:pr-4 pb-8"
                style={{
                    paddingTop: 'calc(var(--navbar-h) + 16px)',
                    minHeight: '100vh',
                }}
            >
                {children}
            </main>
        </div>
    );
}