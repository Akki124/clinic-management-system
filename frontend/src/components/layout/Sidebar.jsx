import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  Receipt,
  BarChart3,
  Building2,
  X,
  LogOut,
} from 'lucide-react';

export function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();

  const links = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/patients',
      label: 'Patients & Records',
      icon: Users,
      show: true,
    },
    {
      to: '/appointments',
      label: 'Appointments & Queue',
      icon: CalendarCheck,
      show: true,
    },
    {
      to: '/billing',
      label: 'Billing & Invoices',
      icon: Receipt,
      show: true,
    },
    {
      to: '/doctors',
      label: 'Doctor Profile',
      icon: Stethoscope,
      show: true,
    },
    {
      to: '/reports',
      label: 'Analytics & Reports',
      icon: BarChart3,
      show: true,
    },
    {
      to: '/settings',
      label: 'Clinic Settings',
      icon: Building2,
      show: true,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </div>
          {/* Close button visible only on mobile drawer */}
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 mt-2">
          {links
            .filter((link) => link.show)
            .map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 shrink-0 space-y-3">
        <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400 space-y-1 border border-slate-700/50">
          <div className="font-medium text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Solo Practice Console</span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            {user?.full_name || 'Dr. Alexander Wright'}
            <div className="text-teal-400 font-mono text-[10px] mt-0.5">Classical Homeopathy • MD</div>
          </div>
        </div>

        {/* Mobile quick logout */}
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="md:hidden w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex w-64 shrink-0 min-h-[calc(100vh-4rem)] flex-col shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible only when mobileOpen is true on < md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Sheet */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
