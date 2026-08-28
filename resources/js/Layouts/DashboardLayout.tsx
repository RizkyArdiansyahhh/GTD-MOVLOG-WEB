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
 *  +----------------------------------------------+
 *  ¦ [Navbar – floating top rounded card]         ¦
 *  +----------------------------------------------¦
 *  ¦          ¦                                   ¦
 *  ¦ Sidebar  ¦  <children />                     ¦
 *  ¦ (card)   ¦                                   ¦
 *  ¦          ¦                                   ¦
 *  +----------------------------------------------+
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
            {/* -- Floating Navbar (does not connect to screen edges) -- */}
            <Navbar
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            />

            {/* -- Toast notifications -- */}
            <Toast />

            {/* -- Fixed Sidebar (below floating navbar) -- */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* -- Main content area -- */}
            <main
                className="flex-1 relative overflow-hidden ml-0 lg:ml-[308px] px-3 lg:px-0 lg:pr-4 pb-8"
                style={{
                    marginTop: '96px',
                    minHeight: 'calc(100vh - 96px)',
                }}
            >
                {children}
            </main>
        </div>
    );
}
