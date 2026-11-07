import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Search,
  Calendar,
  Menu,
  Layers
} from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onToggleMobileSidebar }) {
  const { user, logout } = useAuth();
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

          {/* Right Area: Date Pill + Welcome Pill + Role Switch + Red Logout Button + Mobile Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Current Production Date Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07351b]/80 border border-emerald-700/60 text-emerald-200 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentDate}</span>
            </div>

            {/* User Welcome Pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#07351b]/80 border border-emerald-700/60 text-white text-xs font-medium">
              <span className="text-emerald-300">Welcome,</span>
              <span className="font-semibold truncate max-w-[120px]">{user?.employeeName || 'admin'}</span>
              <span className="text-[10px] text-emerald-300 font-mono">({user?.roles?.[0] || 'User'})</span>
            </div>

            {/* User Assigned Section Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07351b]/80 border border-emerald-500/40 text-emerald-100 text-xs font-semibold shadow-inner">
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span className="truncate max-w-[170px]">
                {user?.sectionName ? user.sectionName : (user?.departmentName || 'All Plant Sections')}
              </span>
              {user?.sectionCode && (
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  {user.sectionCode}
                </span>
              )}
            </div>

            {/* Red Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e04f44] hover:bg-[#c93c31] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Hamburger Drawer Button */}
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
    </header>
  );
}
