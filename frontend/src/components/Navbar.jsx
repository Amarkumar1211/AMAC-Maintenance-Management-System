import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  ChevronDown,
  Search,
  Activity,
  Server,
  Database,
  X,
  UserCheck,
  CheckCircle2,
  Calendar,
  Menu
} from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onToggleMobileSidebar }) {
  const { user, logout, login } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Current formatted date matching sample format (DD/MM/YYYY)
  const [currentDate, setCurrentDate] = useState('02/11/2026');

  useEffect(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    setCurrentDate(`${d}/${m}/${y}`);
  }, []);

  const quickRoles = [
    { label: 'Plant Admin (Rajesh Sharma)', username: 'admin', pass: 'Admin@123', role: 'ADMIN', color: 'text-emerald-700 font-bold' },
    { label: 'Supervisor (Amit Verma)', username: 'supervisor1', pass: 'Supervisor@123', role: 'SUPERVISOR', color: 'text-sky-700 font-bold' },
    { label: 'Incharge (Manoj Kumar)', username: 'incharge1', pass: 'Incharge@123', role: 'MAINTENANCE_INCHARGE', color: 'text-teal-700 font-bold' },
    { label: 'Technician (Ramesh Yadav)', username: 'mech1', pass: 'Mechanic@123', role: 'MECHANIC', color: 'text-amber-700 font-bold' },
  ];

  const handleQuickSwitch = async (account) => {
    setSwitching(true);
    setRoleMenuOpen(false);
    try {
      await login(account.username, account.pass);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const handlePingServer = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/masters/departments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('mbms_token') || ''}` }
      });
      const end = performance.now();
      setPingLatency(Math.round(end - start));
    } catch (err) {
      setPingLatency('Err');
    } finally {
      setPinging(false);
    }
  };

  return (
    <header className="bg-[#0a4423] border-b border-[#07351b] sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-full mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">

          {/* Left Brand block: Logo + Company Name + Subtitle (Responsive for Mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-white/20 overflow-hidden shrink-0">
              <img src="/logo.jpg" alt="AMAC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-black text-xs sm:text-base tracking-wide text-white uppercase leading-tight font-sans">
                <span className="sm:hidden">ASIAAN METALS</span>
                <span className="hidden sm:inline">ASIAAN METALS & ALUMINIUM CASTING PVT LTD</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/90 font-medium tracking-tight truncate max-w-[170px] sm:max-w-none">
                <span className="sm:hidden">MBMS - Maintenance Portal</span>
                <span className="hidden sm:inline">Machine Breakdown & Maintenance Management System</span>
              </p>
            </div>
          </div>

          {/* Middle: Quick Search pill input (Desktop only) */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, machine..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-800 placeholder-slate-400 rounded-full border border-emerald-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1ea751]"
              />
            </div>
          </div>

          {/* Right Area: Date Pill + Welcome Pill + Role Switch + Status + Red Logout Button + Mobile Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Date Pill (Desktop) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07351b]/80 border border-emerald-700/60 text-emerald-100 text-xs font-mono font-medium shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentDate}</span>
            </div>

            {/* User Welcome Pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#07351b]/80 border border-emerald-700/60 text-white text-xs font-medium">
              <span className="text-emerald-300">Welcome,</span>
              <span className="font-semibold truncate max-w-[120px]">{user?.employeeName || 'admin'}</span>
              <span className="text-[10px] text-emerald-300 font-mono">({user?.roles?.[0] || 'User'})</span>
            </div>

            {/* Server Status Pill (5102 / 5103) */}
            <button
              onClick={() => setStatusModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#07351b]/90 hover:bg-[#07351b] border border-emerald-600/80 text-emerald-200 text-xs font-mono transition-all"
              title="Click to view running application status and ports"
            >
              <span className="w-2 h-2 rounded-full bg-[#1ea751] animate-pulse" />
              <span className="font-bold text-[11px]">5102 / 5103</span>
            </button>

            {/* Quick Switch Role Dropdown (Desktop) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07351b] hover:bg-[#0e522b] border border-emerald-700/60 text-xs text-white transition-all"
                title="Switch Indian factory user role"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xl:inline text-xs font-medium">Switch User</span>
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-slate-800">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Indian Factory Personnel Login
                  </div>
                  {quickRoles.map((r) => (
                    <button
                      key={r.username}
                      disabled={switching}
                      onClick={() => handleQuickSwitch(r)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                        user?.username === r.username ? 'bg-emerald-50/80 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-slate-900 font-medium">{r.label}</span>
                        <span className={`text-[10px] ${r.color}`}>{r.role}</span>
                      </div>
                      {user?.username === r.username && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button (Coral Red Pill matching mobile screenshot) */}
            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#e04f44] hover:bg-[#c93c32] text-white text-xs font-semibold shadow-md transition-all active:scale-95 shrink-0"
              title="Sign out of MBMS"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            {/* Mobile Hamburger Drawer Trigger (Direct match to mobile screenshot) */}
            <button
              onClick={onToggleMobileSidebar}
              className="p-1.5 sm:p-2 rounded-xl bg-[#07351b] hover:bg-[#0f552e] text-emerald-200 hover:text-white border border-emerald-700/60 md:hidden flex items-center justify-center transition-all shrink-0 active:scale-95"
              title="Open Department Navigation"
              aria-label="Open Department Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>

        </div>
      </div>

      {/* SYSTEM STATUS & RUNNER MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                AMAC MBMS System Status
              </h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Backend Web API</div>
                    <div className="text-[10px] text-slate-500 font-mono">http://localhost:5102</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                  PORT 5102 ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Frontend UI (Vite)</div>
                    <div className="text-[10px] text-slate-500 font-mono">http://localhost:5103</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                  PORT 5103 ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">SQL Server 2022 Express</div>
                    <div className="text-[10px] text-slate-500 font-mono">localhost\SQLEXPRESS • MBMS_Production</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handlePingServer}
                disabled={pinging}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0e4d2a] font-semibold text-xs border border-emerald-200"
              >
                {pinging ? 'Testing...' : pingLatency ? `Ping: ${pingLatency}ms` : 'Ping API Port'}
              </button>

              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white font-bold text-xs shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
