import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { HeartPulse, Lock, Mail, ArrowRight, Shield, Stethoscope, UserCheck } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { clinic } = useClinic();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, quickPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center items-center p-3.5 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          {clinic?.logo_url ? (
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-teal-500/10 p-2 mb-3 sm:mb-4 border border-slate-700/50">
              <img
                src={clinic.logo_url}
                alt={clinic.clinic_name}
                className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/30 mb-3 sm:mb-4">
              <HeartPulse className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {clinic?.clinic_name || 'AuraCare Clinic'}
          </h1>
          <p className="text-slate-400 mt-1.5 sm:mt-2 text-xs sm:text-sm">
            {clinic?.tagline || 'Comprehensive Clinical Practice & Practice Management'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 border border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-0.5 sm:mb-1">Welcome back</h2>
          <p className="text-xs text-slate-500 mb-5 sm:mb-6">Enter your clinical credentials to continue</p>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Admin Single-User Quick Access */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Administrator Access
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@clinic.com', 'Admin@123')}
                className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-left transition group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-950">Master Admin Sign-In</div>
                    <div className="text-[10px] text-teal-700">Dr. Alexander Wright, MD (Classical Homeopathy)</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-teal-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                  Full Authority
                </span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
              * Doctor and Receptionist logins are deactivated. All registration, homeopathic consultations, prescriptions, and billing are consolidated under Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
