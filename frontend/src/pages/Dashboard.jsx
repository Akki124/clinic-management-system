import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge, PaymentBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Modal';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckCircle,
  IndianRupee,
  AlertCircle,
  Stethoscope,
  PlusCircle,
  UserPlus,
  Receipt,
  Clock,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export function Dashboard() {
  const { user, isAdmin, isDoctor, isReceptionist } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading clinic operations dashboard..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const stats = data?.stats || {};
  const todayAppointments = data?.today_appointments || [];
  const recentVisits = data?.recent_visits || [];

  // Filter today's appointments for this doctor if role is DOCTOR
  const doctorTodayAppointments = isDoctor
    ? todayAppointments.filter((a) => a.doctor_id === user.doctor_id)
    : todayAppointments;

  const doctorWaitingCount = doctorTodayAppointments.filter(
    (a) => a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS'
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-xl shadow-teal-950/10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-teal-200 mb-2.5 border border-white/10">
            <Activity className="w-3.5 h-3.5 text-teal-300" />
            Live Clinic Console
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Solo Homeopathy Practice & Master Admin Console. Complete authority over patient consultations, prescriptions, invoicing, and clinic management.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/patients"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-white text-teal-900 rounded-xl text-xs sm:text-sm font-semibold hover:bg-teal-50 transition shadow-md"
          >
            <UserPlus className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Register</span>
          </Link>

          <Link
            to="/appointments"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-teal-500/30 hover:bg-teal-500/40 border border-teal-300/30 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md transition"
          >
            <Calendar className="w-4 h-4 text-teal-200 shrink-0" />
            <span>Appointments</span>
          </Link>

          <Link
            to="/billing"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-teal-500/30 hover:bg-teal-500/40 border border-teal-300/30 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md transition"
          >
            <Receipt className="w-4 h-4 text-teal-200 shrink-0" />
            <span>Billing & Invoices</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row - 2 cols on mobile, 4 on desktop */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Patients
              </div>
              <div className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5 sm:mt-1">{stats.total_patients}</div>
              <div className="text-[10px] sm:text-xs text-teal-600 font-medium mt-0.5 sm:mt-1 truncate">Registered</div>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Today Appts
              </div>
              <div className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5 sm:mt-1">{stats.today_appointments}</div>
              <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5 sm:mt-1 truncate">
                {stats.today_completed} done
              </div>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Revenue
              </div>
              <div className="text-base sm:text-2xl font-bold text-slate-800 mt-0.5 sm:mt-1 truncate">
                <span>₹{Number(stats.total_revenue || 0).toLocaleString()}</span>
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-0.5 sm:mt-1 truncate">Collected</div>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending
              </div>
              <div className="text-lg sm:text-2xl font-bold text-amber-600 mt-0.5 sm:mt-1">
                {stats.unpaid_bills_count}
              </div>
              <div className="text-[10px] sm:text-xs text-amber-700 font-medium mt-0.5 sm:mt-1 truncate">
                ₹{Number(stats.unpaid_bills_amount || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      )}

      {/* OPD Queue & Practice Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Patients Waiting Now
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
              {doctorWaitingCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Checked-in & ready</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's OPD Queue
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
              {todayAppointments.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Booked today</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consulting Homeopath
            </div>
            <div className="text-base sm:text-lg font-extrabold text-slate-800 mt-1 truncate max-w-[170px] sm:max-w-none">
              {user?.full_name || 'Dr. Alexander Wright'}
            </div>
            <div className="text-[11px] text-teal-700 font-medium mt-0.5">Classical Homeopathy • MD</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Two Column Area: Today's Schedule & Recent Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Appointments Schedule (2 spans) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Today's Patient Queue & Appointments
              </h2>
              <p className="text-xs text-slate-400">Live OPD timeline & patient status</p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View Full Schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100">
            {doctorTodayAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No appointments booked for today.
              </div>
            ) : (
              doctorTodayAppointments.map((app) => (
                <div
                  key={app.id}
                  className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{app.start_time}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/patients/${app.patient_id}`}
                          className="text-sm font-bold text-slate-800 hover:text-teal-600 transition"
                        >
                          {app.patient_first_name} {app.patient_last_name}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono">
                          ({app.patient_code})
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        <span className="font-medium text-slate-600">Doctor:</span> {app.doctor_name} •{' '}
                        <span className="italic">{app.reason || 'Routine consultation'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Doctor Action: Start Consultation if checked in or in progress */}
                    {(isDoctor || isAdmin) &&
                      (app.status === 'CHECKED_IN' || app.status === 'IN_PROGRESS' || app.status === 'CONFIRMED') && (
                        <Link
                          to={`/consultation/${app.id}`}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          Consultation
                        </Link>
                      )}

                    {app.status === 'COMPLETED' && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}

                    <Link
                      to={`/patients/${app.patient_id}`}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Clinical Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-bold text-slate-800">Recent Completed Visits</h2>
            <p className="text-xs text-slate-400">Diagnosis & clinical history feed</p>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {recentVisits.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No recent visits recorded.
              </div>
            ) : (
              recentVisits.map((v) => (
                <div key={v.id} className="py-3 px-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">
                      {v.first_name} {v.last_name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-teal-700 font-medium">
                    {v.doctor_name} ({v.specialization})
                  </div>
                  <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="font-medium text-slate-700">Diagnosis: {v.diagnosis}</div>
                    {v.blood_pressure && (
                      <div className="text-[11px] text-slate-500 mt-0.5">BP: {v.blood_pressure}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <Link
              to="/patients"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              Browse All Patient Histories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
