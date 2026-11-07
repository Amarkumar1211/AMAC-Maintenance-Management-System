import React, { useState } from 'react';
import {
  Factory,
  Wrench,
  Flame,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, mobileOpen, onClose, user }) {
  const [collapsed, setCollapsed] = useState(false);

  // Pure MBMS Maintenance Management Portals scoped by role
  const allNavItems = [
    {
      id: 'supervisor',
      label: 'Production (Intake)',
      sub: 'Shift Breakdowns & Stoppages',
      icon: Factory,
      roles: ['SUPERVISOR', 'MAINTENANCE_INCHARGE', 'ADMIN'],
    },
    {
      id: 'incharge',
      label: 'Maintenance Triage',
      sub: 'Technician Dispatch & Sign-off',
      icon: Wrench,
      roles: ['MAINTENANCE_INCHARGE', 'ADMIN'],
    },
    {
      id: 'mechanic',
      label: 'Mechanic Workbench',
      sub: 'Repair Execution & Labor Timers',
      icon: Flame,
      roles: ['MECHANIC', 'ADMIN'],
    },
    {
      id: 'reports',
      label: 'Reports & Dashboard',
      sub: 'MTTR, MTTF, Availability & SLA',
      icon: BarChart3,
      roles: ['SUPERVISOR', 'MAINTENANCE_INCHARGE', 'ADMIN'],
    },
    {
      id: 'masters',
      label: 'Admin Panel & Masters',
      sub: 'Machines, Spare Parts & Config',
      icon: ShieldCheck,
      roles: ['ADMIN'],
    },
  ];

  const userRoles = user?.roles || [];
  const navItems = allNavItems.filter(item =>
    userRoles.includes('ADMIN') || item.roles.some(r => userRoles.includes(r))
  );

  const handleSelectTab = (tabId) => {
    onTabChange(tabId);
    if (onClose) onClose();
  };

  const navContent = (isMobileDrawer = false) => (
    <>
      {/* Sidebar Header with DEPARTMENTS label */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#0f552e] shrink-0">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200/90 font-mono">
          DEPARTMENTS
        </span>
        {isMobileDrawer ? (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#0f552e] text-emerald-300 hover:text-white transition-colors ml-auto cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-[#0f552e] text-emerald-300 hover:text-white transition-colors ml-auto cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User Section Isolation Banner */}
      {(!collapsed || isMobileDrawer) && user && (
        <div className="px-3.5 py-2.5 mx-2 mt-2 mb-1 rounded-xl bg-[#07351b]/80 border border-[#0f552e] text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-200 font-bold truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="truncate">{user.employeeName || user.username}</span>
          </div>
          <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5 flex items-center justify-between">
            <span className="truncate">{user.sectionName || user.departmentName || 'Global Access'}</span>
            {user.sectionCode && (
              <span className="text-[9px] bg-emerald-800 text-emerald-200 px-1 rounded font-bold ml-1 shrink-0">
                {user.sectionCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isIconOnly = !isMobileDrawer && collapsed;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full text-left rounded-xl flex items-center gap-3 transition-all ${isIconOnly ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'
                } ${isActive
                  ? 'bg-[#1ea751] text-white font-semibold shadow-md shadow-[#0b4624]/40'
                  : 'text-emerald-100/90 hover:bg-[#0f552e] hover:text-white font-medium'
                }`}
              title={isIconOnly ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-300'}`} />

              {!isIconOnly && (
                <div className="flex-1 truncate">
                  <div className="text-xs sm:text-sm tracking-tight leading-tight truncate">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-emerald-300/70'}`}>
                    {item.sub}
                  </div>
                </div>
              )}

              {!isIconOnly && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Plant Info */}
      {(!collapsed || isMobileDrawer) && (
        <div className="p-3 border-t border-[#0f552e] bg-[#07351b]/90 text-[10px] text-emerald-300/80 text-center font-mono shrink-0">
          <div className="font-semibold text-emerald-200">AMAC • Unit 5 (U5)</div>
          <div className="text-emerald-400 font-bold mt-0.5">MBMS v2.0</div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex bg-[#0b4624] text-white flex-col shrink-0 transition-all duration-300 border-r border-[#08351b] z-20 h-full overflow-hidden ${collapsed ? 'w-16' : 'w-64'
          }`}
      >
        {navContent(false)}
      </aside>

      {/* MOBILE OFF-CANVAS DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0b4624] text-white shadow-2xl z-50 flex flex-col border-r border-[#08351b] animate-in slide-in-from-left duration-200">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
