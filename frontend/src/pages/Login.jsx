import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Factory, Shield, Wrench, Users, ArrowRight, Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'Plant Admin (Rajesh Sharma)', role: 'ADMIN', user: 'admin', pass: 'Admin@123', icon: Factory, color: 'border-emerald-600/50 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100' },
    { label: 'Shift Supervisor (Amit Verma)', role: 'SUPERVISOR', user: 'supervisor1', pass: 'Supervisor@123', icon: Shield, color: 'border-sky-600/50 text-sky-800 bg-sky-50/70 hover:bg-sky-100' },
    { label: 'Maint. Incharge (Manoj Kumar)', role: 'INCHARGE', user: 'incharge1', pass: 'Incharge@123', icon: Users, color: 'border-teal-600/50 text-teal-800 bg-teal-50/70 hover:bg-teal-100' },
    { label: 'Technician (Ramesh Yadav)', role: 'MECHANIC', user: 'mech1', pass: 'Mechanic@123', icon: Wrench, color: 'border-amber-600/50 text-amber-800 bg-amber-50/70 hover:bg-amber-100' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      setLoading(true);
      setError('');
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc) => {
    setUsername(acc.user);
    setPassword(acc.pass);
    try {
      setLoading(true);
      setError('');
      await login(acc.user, acc.pass);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header with AMAC Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-20 h-20 rounded-2xl bg-white p-2 items-center justify-center shadow-xl border border-slate-200 mb-2 overflow-hidden">
            <img src="/logo.jpg" alt="AMAC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0a4423] tracking-wide uppercase font-sans">
            ASIAAN METALS & ALUMINIUM CASTING
          </h1>
          <p className="text-xs text-slate-600 font-semibold tracking-wide">
            Machine Breakdown & Maintenance Management System
          </p>
          <p className="text-[11px] text-emerald-800 font-mono font-medium">
            Pune Plant #1 • Chakan Industrial Area • Port 5102 / 5103
          </p>
        </div>

        {/* Form Card (Crisp White Card with Deep Green Accents) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-800">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Employee Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. supervisor1, incharge1, mech1, admin"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0a4423] focus:ring-1 focus:ring-[#0a4423] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0a4423] focus:ring-1 focus:ring-[#0a4423] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0a4423] hover:bg-[#07351b] text-white text-xs font-bold shadow-lg shadow-[#0a4423]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? 'Authenticating...' : 'Sign In to Station'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Preset Selector for Testing */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              Quick Factory Accounts (Demo / Testing):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.user}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className={`p-2.5 rounded-xl border ${acc.color} text-left transition-all group`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{acc.role}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">{acc.user}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          AMAC Industrial On-Premises Server • Local Factory LAN
        </div>

      </div>
    </div>
  );
}
