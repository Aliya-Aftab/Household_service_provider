import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  HiHome,
  HiUsers,
  HiBriefcase,
  HiCalendar,
  HiChartBar,
  HiCog,
  HiMenu,
  HiX,
  HiArrowLeft,
  HiExternalLink,
} from 'react-icons/hi';

const sidebarLinks = [
  { path: '/admin', icon: HiHome, label: 'Dashboard', end: true },
  { path: '/admin/users', icon: HiUsers, label: 'Users' },
  { path: '/admin/providers', icon: HiBriefcase, label: 'Providers' },
  { path: '/admin/bookings', icon: HiCalendar, label: 'Bookings' },
  { path: '/admin/analytics', icon: HiChartBar, label: 'Analytics' },
  { path: '/admin/settings', icon: HiCog, label: 'Settings' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 left-0 top-0 h-screen w-64 bg-white border-r border-border z-50 flex flex-col justify-between
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div>
          {/* Clickable Logo to return Home */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group" title="Return to Main Website">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                  SmartService
                </p>
                <p className="text-xs text-text-muted">Admin Panel</p>
              </div>
            </Link>
            <button 
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100" 
              onClick={() => setSidebarOpen(false)} 
              aria-label="Close sidebar"
            >
              <HiX className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar - Explicit Return Link */}
        <div className="p-3 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-border px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Open sidebar"
            >
              <HiMenu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-text-primary hidden sm:block">Admin Console</h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary hover:bg-gray-100 transition-colors border border-border"
            >
              <span>Main Site</span>
              <HiExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-xs font-semibold">AD</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}