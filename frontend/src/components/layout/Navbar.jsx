import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { RoleBadge } from '../common/Badge';
import { LogOut, HeartPulse, Stethoscope, UserCircle, Menu, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Navbar({ onToggleMobileMenu, isMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const { clinic } = useClinic();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Drawer Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-teal-700" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        <Link to="/dashboard" className="flex items-center space-x-2.5">
          {clinic?.logo_url ? (
            <img
              src={clinic.logo_url}
              alt={clinic.clinic_name}
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate max-w-[170px] sm:max-w-xs md:max-w-md">
              {clinic?.clinic_name || 'AuraCare Clinic'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[160px] sm:max-w-xs hidden xs:block">
              {clinic?.tagline || 'Homeopathy Practice'}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-50 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user.doctor_id ? (
                <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px] md:max-w-[180px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px] md:max-w-[180px]">
                {user.specialization ? 'Classical Homeopath' : user.email}
              </div>
            </div>
            <div className="hidden xs:block">
              <RoleBadge role={user.role} />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
