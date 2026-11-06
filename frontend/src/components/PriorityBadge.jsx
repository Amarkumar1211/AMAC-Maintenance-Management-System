import React from 'react';
import { AlertCircle, AlertTriangle, Info, Flame } from 'lucide-react';

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-red-50 text-red-700 border-red-300 font-bold',
    icon: Flame,
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold',
    icon: AlertCircle,
  },
  LOW: {
    label: 'Low',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Info,
  },
};

export default function PriorityBadge({ priority }) {
  const p = (priority || 'MEDIUM').toUpperCase();
  const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase border ${config.bg} shadow-2xs`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
