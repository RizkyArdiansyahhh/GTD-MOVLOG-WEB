import { type ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface DashboardLayoutProps {
    children: ReactNode;
    /** Optional – kept for backward compat with pages that pass title */
    title?: string;
}

/**
 * DashboardLayout
 *
 * Composed layout:
 *  ┌──────────────────────────────────────────────┐
 *  │ [Navbar – fixed full-width top bar]          │
 *  ├──────────┬───────────────────────────────────┤
 *  │          │                                   │
 *  │ Sidebar  │  <children />                     │
 *  │ (fixed)  │                                   │
 *  │          │                                   │
 *  └──────────┴───────────────────────────────────┘
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: '#F5F7FC', fontFamily: "'Poppins', sans-serif", '--navbar-h': '64px', '--content-gap': '0px', } as React.CSSProperties}
        >
            {/* ── Fixed Navbar (full-width top) ── */}
            <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

            {/* ── Fixed Sidebar (below navbar) ── */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* ── Main content area ── */}
            {/*
              Desktop (lg+): sidebar visible → offset marginLeft = 260 + 16*2 + 16 = 308px
              Mobile/Tablet (< lg): sidebar hidden → marginLeft = 0, add horizontal padding
            */}
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
