import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Wrench,
  Factory,
  HardHat,
  BadgeCheck,
  Building2,
  ChevronRight,
  Activity,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'directory'
  const [badgeFilter, setBadgeFilter] = useState('ALL'); // 'ALL' | 'SUPERVISOR' | 'MECHANIC' | 'LEAD'
  const [rememberShift, setRememberShift] = useState(true);

  // Live Factory Clock & Shift Calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getShiftInfo = (date) => {
    const hours = date.getHours();
    if (hours >= 6 && hours < 14) {
      return { name: 'Shift 1 (Morning)', timing: '06:00 - 14:00', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    } else if (hours >= 14 && hours < 22) {
      return { name: 'Shift 2 (Evening)', timing: '14:00 - 22:00', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    } else {
      return { name: 'Shift 3 (Night)', timing: '22:00 - 06:00', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  const shift = getShiftInfo(currentTime);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both Employee ID and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const stationAccounts = [
    {
      id: 'admin',
      category: 'LEAD',
      roleLabel: 'Plant IT & Engineering Lead',
      name: 'Rajesh Sharma',
      badgeCode: 'EMP-ADMIN',
      section: 'Plant-Wide (Global All Sections)',
      user: 'admin',
      pass: 'Admin@123',
      icon: Shield,
      accent: 'emerald',
    },
    {
      id: 'incharge1',
      category: 'LEAD',
      roleLabel: 'Maintenance Incharge (HOD)',
      name: 'Manoj Kumar',
      badgeCode: 'EMP-INC-01',
      section: 'Plant-Wide Maintenance Dispatch',
      user: 'incharge1',
      pass: 'Incharge@123',
      icon: Building2,
      accent: 'emerald',
    },
    {
      id: 'supervisor1',
      category: 'SUPERVISOR',
      roleLabel: 'Senior Shift Supervisor',
      name: 'Amit Verma',
      badgeCode: 'EMP-SUP-01',
      section: 'Main Assembly Line 1',
      user: 'supervisor1',
      pass: 'Supervisor@123',
      icon: Factory,
      accent: 'blue',
    },
    {
      id: 'supervisor2',
      category: 'SUPERVISOR',
      roleLabel: 'Machining Shop Supervisor',
      name: 'Suresh Patel',
      badgeCode: 'EMP-SUP-02',
      section: 'CNC Milling Section',
      user: 'supervisor2',
      pass: 'Supervisor@123',
      icon: Factory,
      accent: 'blue',
    },
    {
      id: 'supervisor3',
      category: 'SUPERVISOR',
      roleLabel: 'Press Shop Supervisor',
      name: 'Vikram Joshi',
      badgeCode: 'EMP-SUP-03',
      section: 'Hydraulic Press Bay A',
      user: 'supervisor3',
      pass: 'Supervisor@123',
      icon: Factory,
      accent: 'blue',
    },
    {
      id: 'mech1',
      category: 'MECHANIC',
      roleLabel: 'Electrical & AC Drives Specialist',
      name: 'Ramesh Yadav',
      badgeCode: 'EMP-MCH-01',
      section: 'CNC Milling Section',
      user: 'mech1',
      pass: 'Mechanic@123',
      icon: Wrench,
      accent: 'amber',
    },
    {
      id: 'mech2',
      category: 'MECHANIC',
      roleLabel: 'Hydraulics & Pressure Systems',
      name: 'Santosh Kumar',
      badgeCode: 'EMP-MCH-02',
      section: 'Hydraulic Press Bay A',
      user: 'mech2',
      pass: 'Mechanic@123',
      icon: Wrench,
      accent: 'amber',
    },
    {
      id: 'mech3',
      category: 'MECHANIC',
      roleLabel: 'Mechanical Fitter & Assembly',
      name: 'Vikram Singh',
      badgeCode: 'EMP-MCH-03',
      section: 'Main Assembly Line 1',
      user: 'mech3',
      pass: 'Mechanic@123',
      icon: HardHat,
      accent: 'amber',
    },
  ];

  const handleSelectStation = (station, autoSignIn = false) => {
    setUsername(station.user);
    setPassword(station.pass);
    setSelectedStation(station);
    setError('');
    if (autoSignIn) {
      setTimeout(() => {
        login(station.user, station.pass).catch((err) => {
          setError(err.message || 'Auto-sign in failed.');
        });
      }, 50);
    } else {
      setActiveTab('form');
    }
  };

  const filteredStations = stationAccounts.filter((s) => {
    if (badgeFilter === 'ALL') return true;
    return s.category === badgeFilter;
  });

  return (
    <div className="h-screen max-h-screen w-full bg-slate-900 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Industrial Branding & Factory Floor Context */}
      <div className="relative w-full lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#031d0e] via-[#083a1d] to-[#041c0e] p-6 sm:p-8 lg:p-12 text-white flex flex-col justify-between overflow-y-auto border-b lg:border-b-0 lg:border-r border-emerald-900/40">
        
        {/* Subtle Decorative Industrial Blueprint Grid & Radial Glow */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-xl shadow-black/30 border border-emerald-400/20 shrink-0 overflow-hidden">
              <img src="/logo.jpg" alt="AMAC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 tracking-wider uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Unit 5 (U5) • Plant Floor Portal
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase font-sans mt-0.5">
                ASIAAN METALS & ALUMINIUM CASTING
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/80 font-medium leading-relaxed max-w-lg">
            Machine Breakdown & Maintenance Management System (AMAC MBMS). 
            Empowering production bays and mechanical crews with zero-downtime reliability.
          </p>
        </div>

        {/* Center: Live Plant Intelligence & Shift Card */}
        <div className="relative z-10 my-8 sm:my-10 space-y-4 max-w-lg">
          {/* Live Shift Widget */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-4.5 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  Live Factory Clock
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-300 font-mono tracking-wider">
                  {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] uppercase font-mono text-slate-400">Current Shift</div>
                <div className="font-bold text-white text-xs mt-0.5">{shift.name}</div>
                <div className="text-[10px] text-emerald-300 font-mono mt-0.5">{shift.timing}</div>
              </div>

              <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                <div className="text-[10px] uppercase font-mono text-slate-400">LAN Host Status</div>
                <div className="font-bold text-emerald-300 text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Online (Unit 5)
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Port 5102 / 5103</div>
              </div>
            </div>
          </div>

          {/* Key Plant Floor SLA Highlights */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2.5">
              <div className="text-[10px] font-mono uppercase text-emerald-300/80">Avg Response</div>
              <div className="text-sm font-black text-white mt-0.5">&lt; 15 min</div>
              <div className="text-[9px] text-emerald-400/80 font-medium">Triage Target</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2.5">
              <div className="text-[10px] font-mono uppercase text-emerald-300/80">Availability</div>
              <div className="text-sm font-black text-white mt-0.5">98.5%+</div>
              <div className="text-[9px] text-emerald-400/80 font-medium">Uptime Benchmark</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2.5">
              <div className="text-[10px] font-mono uppercase text-emerald-300/80">Bay Security</div>
              <div className="text-sm font-black text-white mt-0.5">Sectioned</div>
              <div className="text-[9px] text-emerald-400/80 font-medium">Zero-Leakage</div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Badge */}
        <div className="relative z-10 pt-4 border-t border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-emerald-200/70 gap-2">
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ISO 9001:2015 & IATF 16949 Maintenance Workflow</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            Secured On-Premises LAN
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Enterprise Authentication & Station Portal */}
      <div className="w-full lg:w-7/12 xl:w-1/2 bg-[#f4f7f6] p-4 sm:p-8 lg:p-10 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-lg space-y-5 my-auto">
          
          {/* Top Tabs: Standard Sign-In vs. Station Directory */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'form'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Operator Sign-In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Shop Station Directory</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">8</span>
            </button>
          </div>

          {/* TAB 1: Operator Sign-In Form */}
          {activeTab === 'form' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
              
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Shop Floor Station Authentication
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate using your assigned employee ID to access your section workbench.
                </p>
              </div>

              {/* Selected Badge Indicator (if chosen from directory) */}
              {selectedStation && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {selectedStation.badgeCode.slice(-2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{selectedStation.name}</div>
                      <div className="text-[10px] text-emerald-800 font-semibold">{selectedStation.section}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStation(null);
                      setUsername('');
                      setPassword('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-red-600 font-mono underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-bold block">Authentication Notice</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Employee ID / Username</label>
                    <span className="text-[10px] text-slate-400 font-mono">e.g. supervisor1, mech1</span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Employee Username or ID"
                      required
                      autoFocus
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] focus:bg-white focus:ring-2 focus:ring-[#0e4d2a]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Security Password</label>
                    <span className="text-[10px] text-emerald-800 font-medium">Shop Floor Password</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] focus:bg-white focus:ring-2 focus:ring-[#0e4d2a]/10 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={rememberShift}
                      onChange={(e) => setRememberShift(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0e4d2a] focus:ring-[#0e4d2a] border-slate-300"
                    />
                    <span className="text-[11px] font-medium">Keep signed in for current shift</span>
                  </label>
                  <a
                    href="#directory"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('directory');
                    }}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
                  >
                    Lookup Section ID →
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0e4d2a] to-[#0a3a1f] hover:from-[#093e21] hover:to-[#072d18] text-white text-xs font-bold transition-all shadow-lg shadow-[#0e4d2a]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Section Clearance...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize & Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Helper Callout to Directory */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">Testing shop floor stations?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:text-emerald-950 font-bold"
                >
                  <span>Open 8 Station Badges</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: Shop Floor Station Directory (Badges Roster) */}
          {activeTab === 'directory' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Authorized Shop Floor Stations</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select an authorized station badge to test section-wise clearance and portals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Back to Sign-In
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setBadgeFilter('ALL')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    badgeFilter === 'ALL'
                      ? 'bg-[#0e4d2a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Stations (8)
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter('SUPERVISOR')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    badgeFilter === 'SUPERVISOR'
                      ? 'bg-[#0e4d2a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Supervisors (3)
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter('MECHANIC')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    badgeFilter === 'MECHANIC'
                      ? 'bg-[#0e4d2a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Technicians (3)
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeFilter('LEAD')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    badgeFilter === 'LEAD'
                      ? 'bg-[#0e4d2a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Plant Leads (2)
                </button>
              </div>

              {/* Station Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredStations.map((station) => {
                  const IconComponent = station.icon;
                  const isSelected = selectedStation?.id === station.id;

                  return (
                    <div
                      key={station.id}
                      className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-sm'
                          : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-slate-900 leading-tight">
                              {station.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {station.badgeCode}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-600 font-medium">
                          {station.roleLabel}
                        </div>

                        <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-100/70 text-[10px] font-semibold text-emerald-900 max-w-full truncate">
                          📍 {station.section}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-mono text-slate-500">
                          {station.user}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSelectStation(station, false)}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 text-[10px] font-bold shadow-2xs hover:bg-emerald-50 transition-all"
                          >
                            Fill Form
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectStation(station, true)}
                            className="px-2 py-1 rounded-lg bg-[#0e4d2a] hover:bg-[#08351b] text-white text-[10px] font-bold shadow-2xs transition-all flex items-center gap-1"
                          >
                            <span>Sign In</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-mono">
                  All passwords default to standard role format: <code className="text-slate-600 font-bold">Role@123</code> (e.g. Supervisor@123, Mechanic@123, Admin@123)
                </p>
              </div>

            </div>
          )}

          {/* Plant Floor IT Support Notice */}
          <div className="text-center text-[11px] text-slate-400 font-mono space-y-1">
            <div>
              AMAC MBMS v2.4 • Asiaan Metals & Aluminium Casting Pvt Ltd — Unit 5 (U5)
            </div>
            <div className="text-[10px] text-slate-400">
              Floor IT Support: <span className="font-semibold text-slate-600">Ext. 5100 (Maintenance Bay #3)</span> • On-Premises LAN Host
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}