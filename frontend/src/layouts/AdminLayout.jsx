import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck2,
  CreditCard,
  RotateCcw,
  FileBarChart2,
  BrainCircuit,
  LogOut,
  Database,
  ExternalLink,
  History,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/NotificationBell';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/admin/vehicles', label: 'Vehicle Management', icon: Car },
    { to: '/admin/customers', label: 'Customer Directory', icon: Users },
    { to: '/admin/bookings', label: 'Booking Operations', icon: CalendarCheck2 },
    { to: '/admin/payments', label: 'Payment Ledger', icon: CreditCard },
    { to: '/admin/returns', label: 'Vehicle Returns', icon: RotateCcw },
    { to: '/admin/history', label: 'Rental History Log', icon: History },
    { to: '/admin/reports', label: 'SQL Analytics & Reports', icon: FileBarChart2 },
    { to: '/admin/demand', label: 'AI Demand & Rec Stats', icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Executive Dark Navy Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-wide">
                DRIVE<span className="text-rose-500">AI</span> ADMIN
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                PostgreSQL DBMS v18
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Management & DBMS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Database Status & Storefront Link */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-2 rounded-xl">
            <Database className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="font-bold text-[11px]">PostgreSQL Connected</div>
              <div className="text-[10px] text-emerald-500/80">
                ACID Transactions Active
              </div>
            </div>
          </div>

          <Link
            to="/vehicles"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Customer Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              AI-Driven Vehicle Rental Management Console
            </h1>
            <p className="text-xs text-slate-500">
              Role-Based Access Control: <span className="font-semibold text-rose-600">ADMINISTRATOR</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">
                {user?.name || 'System Administrator'}
              </div>
              <div className="text-[11px] text-slate-500">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
