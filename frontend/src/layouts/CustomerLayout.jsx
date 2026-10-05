import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Car,
  Sparkles,
  LayoutDashboard,
  History,
  RotateCcw,
  CreditCard,
  UserCircle,
  LogOut,
  ShieldAlert,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/NotificationBell';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Customer Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Drive<span className="text-indigo-600">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                Smart Rental DBMS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {user && user.role === 'CUSTOMER' && (
              <NavLink to="/customer/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
            )}
            <NavLink to="/vehicles" className={navItemClass}>
              <Car className="w-4 h-4" />
              <span>Explore Fleet</span>
            </NavLink>
            {user && (
              <>
                <NavLink to="/customer/recommendations" className={navItemClass}>
                  <Sparkles className="w-4 h-4" />
                  <span>AI For You</span>
                </NavLink>
                <NavLink to="/customer/payments" className={navItemClass}>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay & Modes</span>
                </NavLink>
                <NavLink to="/customer/rentals" className={navItemClass}>
                  <RotateCcw className="w-4 h-4" />
                  <span>Active & Return</span>
                </NavLink>
                <NavLink to="/customer/history" className={navItemClass}>
                  <History className="w-4 h-4" />
                  <span>History</span>
                </NavLink>
                <NavLink to="/customer/profile" className={navItemClass}>
                  <UserCircle className="w-4 h-4" />
                  <span>Profile</span>
                </NavLink>
              </>
            )}
            {user && user.role === 'ADMIN' && (
              <NavLink
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Admin Console</span>
              </NavLink>
            )}
          </nav>

          {/* Right Auth / Theme / Notification Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline">Dark</span>
                </>
              )}
            </button>
            {user ? (
              <>
                <NotificationBell />
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">DriveAI Rental DBMS</span>
            <span>— PostgreSQL + FastAPI + Explainable AI Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/vehicles" className="hover:text-white">
              Browse Fleet
            </Link>
            <Link to="/login" className="hover:text-white">
              Customer Portal
            </Link>
            <Link to="/login" className="hover:text-white">
              Admin Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
