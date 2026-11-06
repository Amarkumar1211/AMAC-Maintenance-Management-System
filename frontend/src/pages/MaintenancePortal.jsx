import React, { useState, useEffect } from 'react';
import { TicketsAPI, MastersAPI } from '../services/api';
import { subscribeToNotification } from '../services/signalr';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TicketDetailModal from '../components/TicketDetailModal';
import {
  Wrench,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Search,
  Settings,
  RotateCcw,
  Phone,
  ChevronRight,
  X
} from 'lucide-react';

export default function MaintenancePortal() {
  const [activeTab, setActiveTab] = useState('triage'); // 'triage', 'approval_queue', 'mechanics_matrix', 'all_open'
  const [tickets, setTickets] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Dispatch Modal state
  const [quickAssignTicket, setQuickAssignTicket] = useState(null);
  const [assignMechanicId, setAssignMechanicId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, mList] = await Promise.all([
        TicketsAPI.getAll(),
        MastersAPI.getMechanics()
      ]);
      setTickets(tList);
      setMechanics(mList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribeCreated = subscribeToNotification('TicketCreated', () => loadData());
    const unsubscribeAssigned = subscribeToNotification('TicketAssigned', () => loadData());
    const unsubscribeStatus = subscribeToNotification('TicketStatusChanged', () => loadData());
    const unsubscribeApproval = subscribeToNotification('ApprovalPending', () => loadData());

    return () => {
      unsubscribeCreated();
      unsubscribeAssigned();
      unsubscribeStatus();
      unsubscribeApproval();
    };
  }, []);

  const handleQuickAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignMechanicId || !quickAssignTicket) return;

    try {
      setSubmittingDispatch(true);
      await TicketsAPI.assign(quickAssignTicket.ticketId, parseInt(assignMechanicId), assignRemarks);
      setQuickAssignTicket(null);
      setAssignMechanicId('');
      setAssignRemarks('');
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const unassignedTickets = tickets.filter(t => t.currentStatus === 'NEW');
  const inchargeApprovalQueue = tickets.filter(t => t.currentStatus === 'AWAITING_INCHARGE');
  const allActiveTickets = tickets.filter(t => t.currentStatus !== 'CLOSED' && t.currentStatus !== 'CANCELLED');

  const filteredActiveTickets = allActiveTickets.filter(t =>
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.breakdownReason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Top Banner (Theme Sample Card) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Maintenance Command — Technician Dispatch & Triage
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review live plant breakdown notifications, dispatch technicians, and execute final engineering closure sign-offs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1ea751] animate-ping" />
            <span className="text-emerald-950 font-medium">
              Available Technicians: <strong className="font-mono text-emerald-800">{mechanics.filter(m => m.isAvailable).length} / {mechanics.length}</strong>
            </span>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh triage"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'triage'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unassigned Triage ({unassignedTickets.length})</span>
            {unassignedTickets.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('approval_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'approval_queue'
                ? 'bg-[#1ea751] text-white shadow-xs ring-2 ring-[#1ea751]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Final Sign-off Queue ({inchargeApprovalQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mechanics_matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'mechanics_matrix'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Technicians Roster ({mechanics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_open')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'all_open'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>All Open Incidents ({allActiveTickets.length})</span>
          </button>
        </div>

        {activeTab === 'all_open' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter machine, ticket..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] w-full sm:w-56"
            />
          </div>
        )}
      </div>

      {/* TAB 1: UNASSIGNED TRIAGE INBOX */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Incoming breakdown alerts waiting for mechanic assignment</span>
            <span className="font-mono text-[#0e4d2a] font-bold">{unassignedTickets.length} new incidents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedTickets.map((t) => (
              <div
                key={t.ticketId}
                className="bg-white border-2 border-amber-300 hover:border-amber-400 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {t.ticketNumber}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>

                  <h3 className="font-black text-base text-slate-900 mb-0.5 leading-snug">
                    {t.machineCode} — {t.machineName}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">
                    {t.departmentName} • Category: <strong className="text-slate-700">{t.categoryName}</strong>
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs text-slate-800 mb-4">
                    <strong className="text-amber-900 block mb-1">Reason:</strong>
                    {t.breakdownReason}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    Occurred: {new Date(t.breakdownOccurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTicketId(t.ticketId)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        setQuickAssignTicket(t);
                        setAssignMechanicId('');
                        setAssignRemarks('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Dispatch Mechanic</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {unassignedTickets.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All breakdown incidents have been dispatched</p>
                <p className="text-xs text-slate-500 mt-1">Maintenance triage queue is completely clear.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FINAL APPROVAL SIGN-OFF QUEUE */}
      {activeTab === 'approval_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Repairs verified by Supervisor, awaiting Incharge final technical review, digital signature and closure</span>
            <span className="font-mono text-emerald-800 font-bold">{inchargeApprovalQueue.length} pending sign-offs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inchargeApprovalQueue.map((t) => (
              <div
                key={t.ticketId}
                className="bg-white border-2 border-emerald-400 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {t.ticketNumber}
                    </span>
                    <StatusBadge status={t.currentStatus} />
                  </div>

                  <h3 className="font-black text-base text-slate-900 leading-snug">
                    {t.machineCode} — {t.machineName}
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">{t.departmentName}</div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 mb-4 space-y-1">
                    <div><strong className="text-slate-600">Failure:</strong> {t.breakdownReason}</div>
                    <div><strong className="text-emerald-900">Assigned Technician:</strong> {t.assignedMechanicName}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                  <span className="text-xs font-bold text-red-700 font-mono bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                    {t.totalDowntimeMinutes}m stoppage
                  </span>

                  <button
                    onClick={() => setSelectedTicketId(t.ticketId)}
                    className="px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Review & Final Sign-off</span>
                  </button>
                </div>
              </div>
            ))}

            {inchargeApprovalQueue.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No work orders awaiting Incharge approval</p>
                <p className="text-xs text-slate-500 mt-1">All verified repairs have been signed off and closed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MECHANIC ALLOCATION MATRIX */}
      {activeTab === 'mechanics_matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Plant Maintenance Roster & Skill Specialization</span>
            <span className="font-mono text-emerald-800 font-bold">{mechanics.length} total technicians</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mechanics.map((m) => (
              <div
                key={m.mechanicId}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-slate-500 font-bold">{m.employeeCode}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      m.isAvailable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {m.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 font-bold flex items-center justify-center text-base shadow-xs">
                      {m.employeeName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{m.employeeName}</h4>
                      <p className="text-xs text-emerald-800 font-semibold">{m.specialization || 'General Maintenance'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <strong className="text-slate-900">{m.shiftName || 'General'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Work Orders:</span>
                      <strong className={`font-mono ${m.activeTicketCount > 0 ? 'text-amber-800 font-bold' : 'text-slate-700'}`}>
                        {m.activeTicketCount}
                      </strong>
                    </div>
                    {m.mobileNumber && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                        <span>Direct Contact:</span>
                        <a href={`tel:${m.mobileNumber}`} className="text-emerald-800 font-mono font-bold hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{m.mobileNumber}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ALL OPEN INCIDENTS */}
      {activeTab === 'all_open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActiveTickets.map((t) => (
            <div
              key={t.ticketId}
              onClick={() => setSelectedTicketId(t.ticketId)}
              className="bg-white border border-slate-200/90 hover:border-emerald-500 rounded-3xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {t.ticketNumber}
                  </span>
                  <PriorityBadge priority={t.priority} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">{t.machineCode} — {t.machineName}</h3>
                <div className="text-xs text-slate-500 mb-2.5">{t.departmentName}</div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 mb-3 line-clamp-2">
                  {t.breakdownReason}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <StatusBadge status={t.currentStatus} />
                <span className="text-red-700 font-mono font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  {t.totalDowntimeMinutes}m
                </span>
              </div>
            </div>
          ))}

          {filteredActiveTickets.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No open breakdown incidents matching criteria</p>
            </div>
          )}
        </div>
      )}

      {/* QUICK ASSIGN DISPATCH MODAL */}
      {quickAssignTicket && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0e4d2a]" />
                Dispatch Technician
              </h3>
              <button
                onClick={() => setQuickAssignTicket(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              Ticket: <strong className="font-mono text-emerald-900">{quickAssignTicket.ticketNumber}</strong> • {quickAssignTicket.machineCode}
              <span className="block text-slate-500 mt-1 truncate">{quickAssignTicket.breakdownReason}</span>
            </p>

            <form onSubmit={handleQuickAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Select Technician *</label>
                <select
                  value={assignMechanicId}
                  onChange={(e) => setAssignMechanicId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                >
                  <option value="">-- Choose Mechanic --</option>
                  {mechanics.map(m => (
                    <option key={m.mechanicId} value={m.mechanicId}>
                      {m.employeeName} ({m.specialization || 'General'}) • Active: {m.activeTicketCount} • {m.shiftName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Job Priority Notes</label>
                <textarea
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  placeholder="e.g. Bring hydraulic pressure gauge, check oil level..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickAssignTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assignMechanicId || submittingDispatch}
                  className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold disabled:opacity-40 shadow-sm"
                >
                  {submittingDispatch ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onRefresh={loadData}
        />
      )}

    </div>
  );
}
