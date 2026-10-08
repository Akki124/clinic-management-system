import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/common/Modal';
import { StatusBadge, PaymentBadge } from '../../components/common/Badge';
import {
  BarChart3,
  Users,
  Calendar,
  IndianRupee,
  Receipt,
  Stethoscope,
  TrendingUp,
  Activity,
  ShieldCheck,
} from 'lucide-react';

export function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const res = await api.reports.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) return <LoadingSpinner text="Compiling clinic analytics and reports..." />;

  const stats = data?.stats || {};
  const statusCounts = data?.appointments_by_status || [];
  const doctorStats = data?.doctor_stats || [];
  const recentPayments = data?.recent_payments || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Executive Administrator Reports
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Clinic Analytics & Audit Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive operational metrics, doctor consultation workload, and revenue reconciliation
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-1 sm:mt-2 truncate">
            ₹{Number(stats.total_revenue || 0).toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
            <TrendingUp className="w-3 h-3" /> Settled
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Outstanding</span>
            <div className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-rose-700 mt-1 sm:mt-2 truncate">
            ₹{Number(stats.unpaid_bills_amount || 0).toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
            {stats.unpaid_bills_count} invoice(s)
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Patients</span>
            <div className="p-1.5 sm:p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-1 sm:mt-2">{stats.total_patients}</div>
          <div className="text-[10px] sm:text-xs text-teal-600 mt-0.5 sm:mt-1 truncate">Active records</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Doctors</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-1 sm:mt-2">{stats.total_doctors}</div>
          <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1 truncate">Practicing</div>
        </div>
      </div>

      {/* Two Columns: Doctor Workload and Appointment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Workload Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Doctor Clinical Workload
            </h2>
            <p className="text-xs text-slate-400">Consultation volume by specialist</p>
          </div>

          <div className="p-4">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5">Doctor</th>
                  <th className="py-2.5">Specialization</th>
                  <th className="py-2.5 text-center">Bookings</th>
                  <th className="py-2.5 text-right">Completed Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorStats.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-800">{d.full_name}</td>
                    <td className="py-3 text-teal-700 font-medium">{d.specialization}</td>
                    <td className="py-3 text-center font-mono font-bold text-slate-700">
                      {d.total_appointments}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-700">
                      {d.completed_visits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Appointment Status Breakdown
            </h2>
            <p className="text-xs text-slate-400">Lifecycle distribution of all clinic bookings</p>
          </div>

          <div className="p-5 space-y-3">
            {statusCounts.map((sc) => (
              <div key={sc.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge status={sc.status} />
                </div>
                <span className="font-mono font-bold text-slate-800 text-sm">{sc.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Recent Settlement Transactions
            </h2>
            <p className="text-xs text-slate-400">Payment logs across all counter receipts</p>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(pay.payment_date).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-700">
                    {pay.bill_number}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {pay.first_name} {pay.last_name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{pay.payment_method}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ₹{Number(pay.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
