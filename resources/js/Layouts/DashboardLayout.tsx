import { type ReactNode } from 'react';
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
 * Composed layout for internal users (Admin/Staff):
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
    const NAVBAR_HEIGHT = 64;
    const SIDEBAR_WIDTH = 260;
    const GAP = 16;

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: '#F5F7FC', fontFamily: "'Poppins', sans-serif" }}
        >
            {/* ── Fixed Navbar (full-width top) ── */}
            <Navbar />

            {/* ── Fixed Sidebar (below navbar) ── */}
            <Sidebar />

            {/* ── Main content area ── */}
            <main
                className="flex-1"
                style={{
                    marginTop: `${NAVBAR_HEIGHT + GAP}px`,
                    marginLeft: `${SIDEBAR_WIDTH + GAP * 2 + GAP}px`, // sidebar + left offset + gap
                    minHeight: `calc(100vh - ${NAVBAR_HEIGHT + GAP}px)`,
                    padding: `0 ${GAP}px ${GAP * 2}px 0`,
                }}
            >
                {children}
            </main>
        </div>
    );
}
