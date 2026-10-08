import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CHECKED_IN: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    NO_SHOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const currentStyle = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}
    >
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const styles = {
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    FREE_REVISIT: 'bg-teal-100 text-teal-800 border-teal-300 font-extrabold',
    PARTIAL: 'bg-amber-100 text-amber-800 border-amber-300',
    UNPAID: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const currentStyle = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${currentStyle}`}
    >
      {status || 'UNPAID'}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    DOCTOR: 'bg-blue-100 text-blue-800 border-blue-300',
    RECEPTIONIST: 'bg-teal-100 text-teal-800 border-teal-300',
  };

  const currentStyle = styles[role] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentStyle}`}
    >
      {role}
    </span>
  );
}
