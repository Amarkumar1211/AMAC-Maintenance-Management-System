import React, { useState, useEffect } from 'react';
import { TicketsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotification } from '../services/signalr';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TicketDetailModal from '../components/TicketDetailModal';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Check,
  ChevronRight,
  Flame,
  AlertTriangle,
  RotateCcw,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function MechanicPortal() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all_active'); // 'all_active', 'needs_accept', 'in_progress', 'done'

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await TicketsAPI.getAll();
      setTickets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribeAssigned = subscribeToNotification('TicketAssigned', () => loadData());
    const unsubscribeStatus = subscribeToNotification('TicketStatusChanged', () => loadData());

    return () => {
      unsubscribeAssigned();
      unsubscribeStatus();
    };
  }, []);

  const handleAccept = async (ticketId, e) => {
    if (e) e.stopPropagation();
    try {
      await TicketsAPI.accept(ticketId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStart = async (ticketId, e) => {
    if (e) e.stopPropagation();
    try {
      await TicketsAPI.startWork(ticketId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResume = async (ticketId, e) => {
    if (e) e.stopPropagation();
    try {
      await TicketsAPI.resumeWork(ticketId, 'Resumed by technician');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter tickets for this mechanic or show all assigned to technicians
  const isMechanicRole = user?.roles?.includes('MECHANIC');
  const mechanicTickets = isMechanicRole && user?.mechanicId
    ? tickets.filter(t => t.assignedMechanicId === user.mechanicId || t.assignedMechanicName === user.employeeName)
    : tickets;

  const assignedWaitingAccept = mechanicTickets.filter(t => t.currentStatus === 'ASSIGNED');
  const acceptedReadyToStart = mechanicTickets.filter(t => t.currentStatus === 'ACCEPTED');
  const activeWorking = mechanicTickets.filter(t => t.currentStatus === 'IN_PROGRESS' || t.currentStatus === 'ON_HOLD');
  const submittedWaitingVerify = mechanicTickets.filter(t => t.currentStatus === 'AWAITING_SUPERVISOR' || t.currentStatus === 'AWAITING_INCHARGE');
  const allOpen = mechanicTickets.filter(t => t.currentStatus !== 'CLOSED' && t.currentStatus !== 'CANCELLED');

  const displayedTickets = allOpen.filter(t => {
    if (activeFilter === 'needs_accept') return t.currentStatus === 'ASSIGNED';
    if (activeFilter === 'in_progress') return t.currentStatus === 'IN_PROGRESS' || t.currentStatus === 'ACCEPTED' || t.currentStatus === 'ON_HOLD';
    if (activeFilter === 'done') return t.currentStatus === 'AWAITING_SUPERVISOR' || t.currentStatus === 'AWAITING_INCHARGE';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Top Banner (Theme Sample matching Header Card) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Mechanic Repair Workbench — Field Engineering
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pune Plant #1 • Chakan Industrial Area • Logged Technician: <span className="font-bold text-emerald-800">{user?.employeeName || 'Ramesh Yadav'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Refresh workbench"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Stage Filters (Large, Touch-Friendly for Factory Floor) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => setActiveFilter(activeFilter === 'needs_accept' ? 'all_active' : 'needs_accept')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${activeFilter === 'needs_accept'
              ? 'bg-[#0e4d2a] text-white border-[#0e4d2a] shadow-md ring-2 ring-[#0e4d2a]/30'
              : 'bg-white border-slate-200/90 text-slate-800 hover:border-emerald-400 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${activeFilter === 'needs_accept' ? 'text-emerald-100' : 'text-purple-700'}`}>
              1. Dispatched (New)
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeFilter === 'needs_accept' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
              {assignedWaitingAccept.length}
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight">{assignedWaitingAccept.length}</div>
          <p className={`text-[11px] mt-0.5 ${activeFilter === 'needs_accept' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Click to accept job
          </p>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'in_progress' ? 'all_active' : 'in_progress')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${activeFilter === 'in_progress'
              ? 'bg-[#0e4d2a] text-white border-[#0e4d2a] shadow-md ring-2 ring-[#0e4d2a]/30'
              : 'bg-white border-slate-200/90 text-slate-800 hover:border-emerald-400 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${activeFilter === 'in_progress' ? 'text-emerald-100' : 'text-amber-700'}`}>
              2. In Active Labor
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeFilter === 'in_progress' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
              {activeWorking.length + acceptedReadyToStart.length}
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight">
            {activeWorking.length + acceptedReadyToStart.length}
          </div>
          <p className={`text-[11px] mt-0.5 ${activeFilter === 'in_progress' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Ready / Underway
          </p>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'done' ? 'all_active' : 'done')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${activeFilter === 'done'
              ? 'bg-[#0e4d2a] text-white border-[#0e4d2a] shadow-md ring-2 ring-[#0e4d2a]/30'
              : 'bg-white border-slate-200/90 text-slate-800 hover:border-emerald-400 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${activeFilter === 'done' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              3. Trial Verification
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeFilter === 'done' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
              {submittedWaitingVerify.length}
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight">{submittedWaitingVerify.length}</div>
          <p className={`text-[11px] mt-0.5 ${activeFilter === 'done' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Supervisor checking
          </p>
        </button>

        <button
          onClick={() => setActiveFilter('all_active')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${activeFilter === 'all_active'
              ? 'bg-[#0e4d2a] text-white border-[#0e4d2a] shadow-md ring-2 ring-[#0e4d2a]/30'
              : 'bg-white border-slate-200/90 text-slate-800 hover:border-emerald-400 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${activeFilter === 'all_active' ? 'text-emerald-100' : 'text-slate-700'}`}>
              All Active Work Orders
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${activeFilter === 'all_active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
              {allOpen.length}
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight">{allOpen.length}</div>
          <p className={`text-[11px] mt-0.5 ${activeFilter === 'all_active' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Current plant load
          </p>
        </button>
      </div>

      {/* WORK ORDER LIST (Crisp White Cards with One-Touch Big Buttons) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{displayedTickets.length}</strong> active work orders
            {activeFilter !== 'all_active' && <span className="ml-1 text-emerald-800 font-bold">(filtered)</span>}
          </div>
          {activeFilter !== 'all_active' && (
            <button
              onClick={() => setActiveFilter('all_active')}
              className="text-xs text-emerald-800 font-bold hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTickets.map((t) => (
            <div
              key={t.ticketId}
              onClick={() => setSelectedTicketId(t.ticketId)}
              className="bg-white border border-slate-200/90 hover:border-emerald-500/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header: Ticket #, Status, Priority */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {t.ticketNumber}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <StatusBadge status={t.currentStatus} />
                </div>

                {/* Machine Code & Name */}
                <div className="mb-2.5">
                  <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                    {t.machineCode} — {t.machineName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.departmentName} • Category: <strong className="text-slate-700">{t.categoryName}</strong>
                  </p>
                </div>

                {/* Breakdown Reason Box */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 mb-4 line-clamp-2">
                  <strong className="text-slate-600 block mb-0.5">Reported Issue:</strong>
                  {t.breakdownReason}
                </div>
              </div>

              {/* Bottom Area: Downtime counter + ONE-TOUCH ACTION BUTTON */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    {t.totalDowntimeMinutes}m stoppage
                  </span>
                </div>

                {/* Specific 1-Click Action for this stage */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const canActOnTicket = user?.roles?.includes('ADMIN') || (user?.mechanicId && (t.assignedMechanicId === user.mechanicId || t.assignedMechanicName === user.employeeName));

                    if (t.currentStatus === 'ASSIGNED') {
                      return canActOnTicket ? (
                        <button
                          onClick={(e) => handleAccept(t.ticketId, e)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Job</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          Assigned to {t.assignedMechanicName || 'Technician'}
                        </span>
                      );
                    }

                    if (t.currentStatus === 'ACCEPTED') {
                      return canActOnTicket ? (
                        <button
                          onClick={(e) => handleStart(t.ticketId, e)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Repair</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          Accepted by {t.assignedMechanicName || 'Technician'}
                        </span>
                      );
                    }

                    if (t.currentStatus === 'IN_PROGRESS') {
                      return canActOnTicket ? (
                        <button
                          onClick={() => setSelectedTicketId(t.ticketId)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Log Repair & Parts</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                          Under repair by {t.assignedMechanicName || 'Technician'}
                        </span>
                      );
                    }

                    if (t.currentStatus === 'ON_HOLD') {
                      return canActOnTicket ? (
                        <button
                          onClick={(e) => handleResume(t.ticketId, e)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Play className="w-4 h-4" />
                          <span>Resume Labor</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                          Repair on hold
                        </span>
                      );
                    }

                    return (
                      <button
                        onClick={() => setSelectedTicketId(t.ticketId)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Under Trial Verification</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}

        {displayedTickets.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2.5" />
            <p className="text-sm font-bold text-slate-800">No active work orders in this category</p>
            <p className="text-xs text-slate-500 mt-1">
              Your maintenance workbench is clear. New breakdown dispatches will appear here instantly.
            </p>
          </div>
        )}
      </div>
    </div>

      {/* Ticket Detail Modal */ }
  {
    selectedTicketId && (
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onRefresh={loadData}
      />
    )
  }

    </div >
  );
}
