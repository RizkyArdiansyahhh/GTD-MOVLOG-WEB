import { type ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from '@/Components/Toast';

interface DashboardLayoutProps {
    children: ReactNode;
    /** Optional title kept for backward compatibility */
    title?: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Persist collapse state in localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('gtd_sidebar_collapsed');
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true');
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('gtd_sidebar_collapsed', String(next));
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F7FC] flex text-gray-800 font-sans antialiased">
            {/* -- Left Fixed Desktop Sidebar & Mobile Drawer -- */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            {/* -- Toast Notifications -- */}
            <Toast />

            {/* -- Right Main Wrapper (Adjusts margin based on sidebar collapse) -- */}
            <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
                    isCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-64'
                }`}
            >
                {/* Sticky Header Navbar */}
                <Navbar
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                />

                {/* Main Page Viewport Container */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-h-[calc(100vh-64px)] max-w-[1600px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
