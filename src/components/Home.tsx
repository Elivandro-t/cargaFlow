import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Settings,
    User,
    Search,
    Moon,
    Sun,
    Menu,
    ChevronDown,
    Users,
    LogOut
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useApp } from '../AppContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

const MENU_ITEMS = [
    { id: 'dashboard', path: '/home/dashboard', label: 'Ciclos Op. Externa', sub: 'Monitor de Frota', icon: LayoutDashboard },
    { id: 'search', path: '/home/search', label: 'Análise de Placa', sub: 'Rastreio individual', icon: Search },
    { id: 'sla', path: '/home/sla', label: 'Parâmetros SLA', sub: 'Configurações', icon: Settings },
];

export default function Home() {
    const { darkMode, setDarkMode } = useApp();
    const { user, logout } = useAuthStore();

    const navigate = useNavigate();
    const location = useLocation();
    const logoSrc = darkMode ? '/logo-gm-white.png' : '/logo-gm.png';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const toggleSidebar = () => setSidebarOpen(o => !o);

    useEffect(() => {
        const check = () => {
            const mob = window.innerWidth < 1024;
            setIsMobile(mob);
            if (!mob) setSidebarOpen(false);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#F4F7F6] dark:bg-slate-950">

            {/* Overlay mobile */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* <aside className={cn(
  'fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-200',
  'bg-[#0B1B2B] border-r border-[#12263A]',
  sidebarOpen ? 'w-[260px]' : 'w-[72px]',
  isMobile && !sidebarOpen && '-translate-x-full'
)}></aside> */}

            {/* Sidebar */}
            <aside className={cn(
                'fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-200',
                'bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800',
                sidebarOpen ? 'w-[260px]' : 'w-[72px]',
                isMobile && !sidebarOpen && '-translate-x-full'
            )}>

                {/* Logo */}
                <div className="h-[72px] border-b flex items-center justify-center px-3">
                    <img src={logoSrc} className="h-6 object-contain" />
                </div>

                {/* Menu */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">

                    {MENU_ITEMS.map(item => {
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    'w-full flex items-center rounded-xl transition-all',
                                    sidebarOpen ? 'px-3 py-3 gap-3' : 'justify-center py-3',
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />

                                {sidebarOpen && (
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">{item.label}</p>
                                        <p className="text-xs opacity-70">{item.sub}</p>
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {/* ADMIN */}
                    <div className="mt-2 pt-2 border-t">
                        <button
                            onClick={() => setAdminOpen(o => !o)}
                            className={cn(
                                'w-full flex items-center rounded-xl transition-all duration-200',
                                sidebarOpen
                                    ? 'px-3 py-3 justify-between hover:bg-gray-100 dark:hover:bg-slate-800'
                                    : 'justify-center py-3 hover:bg-gray-100 dark:hover:bg-slate-800'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 shrink-0" />
                                {sidebarOpen && (
                                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                                        Admin
                                    </span>
                                )}
                            </div>

                            {sidebarOpen && (
                                <ChevronDown
                                    className={cn(
                                        'w-4 h-4 text-gray-400 transition-transform duration-200',
                                        adminOpen && 'rotate-180'
                                    )}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {adminOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={cn(
                                        'overflow-hidden',
                                        sidebarOpen
                                            ? 'pl-6 mt-1 space-y-1'
                                            : 'flex flex-col items-center mt-2 space-y-2'
                                    )}
                                >
                                    <button
                                        onClick={() => navigate('/home/admin-dashboard')}
                                        className={cn(
                                            'flex items-center rounded-lg cursor-pointer transition-all',
                                            sidebarOpen
                                                ? 'w-full gap-2 px-2 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
                                                : 'w-10 h-10 justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        )}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        {sidebarOpen && 'Dashboard'}
                                    </button>

                                    <button
                                        onClick={() => navigate('/home/admin-users')}
                                        className={cn(
                                            'flex items-center rounded-lg cursor-pointer transition-all',
                                            sidebarOpen
                                                ? 'w-full gap-2 px-2 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
                                                : 'w-10 h-10 justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        )}
                                    >
                                        <Users className="w-4 h-4" />
                                        {sidebarOpen && 'Usuários'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                {/* USER + LOGOUT */}
                <div className="p-2 border-t">
                    <div className={cn(
                        'flex items-center rounded-xl',
                        sidebarOpen ? 'justify-between px-3 py-2' : 'justify-center p-2'
                    )}>

                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                                {user?.name?.charAt(0)}
                            </div>

                            {sidebarOpen && (
                                <div className="leading-tight">
                                    <p className="text-sm">{user?.name}</p>
                                    <p className="text-xs text-gray-400">{user?.role}</p>
                                </div>
                            )}
                        </div>

                        {sidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {!sidebarOpen && (
                        <button
                            onClick={handleLogout}
                            className="mt-2 w-full flex justify-center text-gray-400 hover:text-red-500"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </aside>

            {/* MAIN */}
            <main
                className={cn(
                    'flex flex-col flex-1 transition-all duration-200 w-full',
                    sidebarOpen ? 'pl-[260px]' : 'pl-[72px]',
                    isMobile && 'pl-0'
                )}
            >

                {/* HEADER */}
                <header className="h-[72px] flex items-center justify-between px-4 border-b bg-white dark:bg-slate-950 shrink-0">

                    {/* LEFT */}
                    <div className="flex items-center gap-3">

                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
                        >
                            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>

                        <div className="flex flex-col leading-tight">
                            <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                               Olá {user?.name}
                            </h1>
                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-2">

                        {/* Dark mode */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
                        >
                            {darkMode ? (
                                <Sun className="w-4 h-4 text-slate-300" />
                            ) : (
                                <Moon className="w-4 h-4 text-slate-700" />
                            )}
                        </button>

                        {/* User */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95">
                            <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        </button>

                    </div>

                </header>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-4 py-2">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}