import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const demoAccounts = [
    { label: 'Plant Administrator', user: 'admin', pass: 'Admin@123', role: 'Full System Control & Masters' },
    { label: 'Maintenance Incharge', user: 'incharge1', pass: 'Incharge@123', role: 'Triage, Dispatch & Sign-off' },
    { label: 'Shift Supervisor', user: 'supervisor1', pass: 'Supervisor@123', role: 'Breakdown Intake & Verification' },
    { label: 'Field Mechanic', user: 'mech1', pass: 'Mechanic@123', role: 'Mobile Workbench & Repair Log' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCreds = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4">
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
            Unit 5 (U5) • Factory LAN Portal
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
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter employee username (e.g. admin)"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] focus:bg-white shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] focus:bg-white shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold transition-all shadow-md shadow-[#0e4d2a]/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Workbench'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Shop Floor Roles */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 text-center">
              Quick Sign-in Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(d => (
                <button
                  key={d.user}
                  type="button"
                  onClick={() => setDemoCreds(d.user, d.pass)}
                  className="p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
                >
                  <div className="font-semibold text-slate-900 text-[11px] truncate">{d.label}</div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">{d.user} / {d.pass}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
