import React, { useState, useEffect } from 'react';
import { TicketsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotification } from '../services/signalr';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TicketDetailModal from '../components/TicketDetailModal';
import BreakdownSlipModal from '../components/BreakdownSlipModal';
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
  Search,
  ArrowRight,
  Printer
} from 'lucide-react';

export default function MechanicPortal() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedSlipTicketId, setSelectedSlipTicketId] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState('active'); // 'active', 'pending', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState(user?.sectionId ? 'my_section' : 'all_plant'); // 'my_section', 'my_assigned', 'all_plant'

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

  // Filter tickets based on section scope and assigned status
  const isPureMechanic = user?.roles?.includes('MECHANIC') && !user?.roles?.includes('ADMIN');
  const mechanicTickets = tickets.filter(t => {
    // If mechanic, strictly lock to their section or assigned work orders (other sections hidden)
    if (isPureMechanic) {
      if (scopeFilter === 'my_assigned' && user?.mechanicId) {
        return t.assignedMechanicId === user.mechanicId || t.assignedMechanicName === user.employeeName;
      }
      if (user?.sectionId && user?.mechanicId) {
        return t.sectionId === user.sectionId || t.assignedMechanicId === user.mechanicId;
      }
      if (user?.sectionId) {
        return t.sectionId === user.sectionId;
      }
      if (user?.mechanicId) {
        return t.assignedMechanicId === user.mechanicId || t.assignedMechanicName === user.employeeName;
      }
    }

    if (scopeFilter === 'my_section' && user?.sectionId) {
      return t.sectionId === user.sectionId || t.assignedMechanicId === user?.mechanicId;
    }
    if (scopeFilter === 'my_assigned' && user?.mechanicId) {
      return t.assignedMechanicId === user.mechanicId || t.assignedMechanicName === user.employeeName;
    }
    // all_plant (Admin only)
    return true;
  });

  // 3 Clear Subsections: Active Work, Pending, Completed
  const activeWorkTickets = mechanicTickets.filter(t =>
    t.currentStatus === 'IN_PROGRESS' ||
    t.currentStatus === 'ACCEPTED' ||
    t.currentStatus === 'ON_HOLD'
  );

  const pendingTickets = mechanicTickets.filter(t =>
    t.currentStatus === 'ASSIGNED' ||
    t.currentStatus === 'AWAITING_SUPERVISOR' ||
    t.currentStatus === 'AWAITING_INCHARGE' ||
    t.currentStatus === 'NEW'
  );

  const completedTickets = mechanicTickets.filter(t =>
    t.currentStatus === 'CLOSED'
  );

  const currentSubsectionList =
    activeSubsection === 'pending' ? pendingTickets :
      activeSubsection === 'completed' ? completedTickets :
        activeWorkTickets;

  const displayedTickets = currentSubsectionList.filter(t =>
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.breakdownReason.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">
                Unit 5 (U5) • Field Technician: <strong className="font-bold text-emerald-900">{user?.employeeName || 'Ramesh Yadav'}</strong>
              </span>
              {user?.sectionName ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ea751]"></span>
                  Assigned Bay: {user.sectionName} ({user.sectionCode})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 font-mono">
                  Plant-Wide Float Technician
                </span>
              )}
            </div>
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

      {/* Section / Work Scope Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
            WORKBENCH SCOPE:
          </span>

          {user?.sectionId && (
            <button
              onClick={() => setScopeFilter('my_section')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${scopeFilter === 'my_section'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{user.sectionName || 'My Section'} Bay</span>
            </button>
          )}

          <button
            onClick={() => setScopeFilter('my_assigned')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${scopeFilter === 'my_assigned'
              ? 'bg-[#0e4d2a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>My Dispatched Jobs Only</span>
          </button>

          {user?.roles?.includes('ADMIN') && (
            <button
              onClick={() => setScopeFilter('all_plant')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${scopeFilter === 'all_plant'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <span>All Plant Work Orders</span>
            </button>
          )}

          {isPureMechanic && (
            <span className="text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-xl">
              🔒 Scoped to {user?.sectionName || 'My Jobs'} • Other sections hidden
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900 font-mono">{mechanicTickets.length}</strong> work orders in current scope
        </div>
      </div>

      {/* 3 Subsections: Active Work | Pending | Completed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubsection('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeSubsection === 'active'
              ? 'bg-[#0e4d2a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Work ({activeWorkTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveSubsection('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeSubsection === 'pending'
              ? 'bg-[#0e4d2a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending ({pendingTickets.length})</span>
            {pendingTickets.filter(t => t.currentStatus === 'ASSIGNED').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubsection('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeSubsection === 'completed'
              ? 'bg-[#0e4d2a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed ({completedTickets.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work orders, machines, reasons..."
            className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] w-full sm:w-64"
          />
        </div>
      </div>

      {/* WORK ORDER LIST (Crisp White Cards with One-Touch Big Buttons) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-mono">{displayedTickets.length}</strong> {activeSubsection === 'active' ? 'active work orders' : activeSubsection === 'pending' ? 'pending work orders' : 'completed work orders'}
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-emerald-800 font-bold hover:underline"
            >
              Clear Search
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
                  <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{t.departmentName}</span>
                    {t.sectionName && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                        {t.sectionName}
                      </span>
                    )}
                    <span>• Category: <strong className="text-slate-700">{t.categoryName}</strong></span>
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
                  <button
                    onClick={() => setSelectedSlipTicketId(t.ticketId)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Print Standard Breakdown Coupon & Job Card"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                  </button>
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
              <p className="text-sm font-bold text-slate-800">
                {activeSubsection === 'pending' ? 'No pending work orders waiting for action' :
                  activeSubsection === 'completed' ? 'No completed work orders in this view' :
                    'No active work orders currently in repair'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeSubsection === 'pending' ? 'Newly dispatched breakdowns and those awaiting verification will show here.' :
                  activeSubsection === 'completed' ? 'Your completed repairs and historical jobs are archived here.' :
                    'Your workbench is clear. Accept pending jobs to start active labor.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onRefresh={loadData}
        />
      )}

      {/* Breakdown Coupon / Intimation Slip Modal */}
      {selectedSlipTicketId && (
        <BreakdownSlipModal
          ticketId={selectedSlipTicketId}
          onClose={() => setSelectedSlipTicketId(null)}
        />
      )}

    </div>
  );
}
