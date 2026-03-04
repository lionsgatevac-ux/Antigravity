import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { label: 'Műszerfal', path: '/', icon: LayoutDashboard },
        { label: 'Munkalapok', path: '/worksheets', icon: FileText },
        { label: 'Beállítások', path: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight">KlímaMester</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={20} />
                        Kilépés
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Alkalmazás'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                SZ
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900">Szerelő Zsolt</p>
                                <p className="text-gray-500 text-xs">Adminisztrátor</p>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
