import React from 'react';

const STATUS_CONFIG = {
  NEW: { label: 'New Incident', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold' },
  AWAITING_SUPERVISOR: { label: 'Awaiting Supervisor', bg: 'bg-sky-50 text-sky-800 border-sky-300 font-bold' },
  SUPERVISOR_REJECTED: { label: 'Supervisor Rework', bg: 'bg-rose-50 text-rose-700 border-rose-300 font-bold' },
  AWAITING_INCHARGE: { label: 'Awaiting Incharge', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' },
  INCHARGE_REJECTED: { label: 'Incharge Rework', bg: 'bg-rose-50 text-rose-700 border-rose-300 font-bold' },
  CLOSED: { label: 'Closed & Verified', bg: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' },
  REOPENED: { label: 'Reopened', bg: 'bg-orange-50 text-orange-800 border-orange-300 font-bold' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-300' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.bg} whitespace-nowrap shadow-2xs`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-90" />
      {config.label}
    </span>
  );
}
