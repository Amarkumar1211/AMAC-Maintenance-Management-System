import React, { useState, useEffect } from 'react';
import { TicketsAPI, MastersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotification } from '../services/signalr';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TicketDetailModal from '../components/TicketDetailModal';
import {
  PlusCircle,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  User,
  Phone,
  Wrench,
  RefreshCw,
  Settings,
  FileText,
  ChevronRight,
  ShieldCheck,
  Check,
  ImageIcon
} from 'lucide-react';

export default function SupervisorPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending_verification', 'new_ticket'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // New Breakdown Form States
  const [machines, setMachines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [machineCondition, setMachineCondition] = useState('STOPPED');
  const [productionImpact, setProductionImpact] = useState('HIGH');
  const [priority, setPriority] = useState('HIGH');
  const [breakdownReason, setBreakdownReason] = useState('');
  const [breakdownDescription, setBreakdownDescription] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, mList, cList] = await Promise.all([
        TicketsAPI.getAll(),
        MastersAPI.getMachines(),
        MastersAPI.getCategories()
      ]);
      setTickets(tList);
      setMachines(mList);
      setCategories(cList);
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

    return () => {
      unsubscribeCreated();
      unsubscribeAssigned();
      unsubscribeStatus();
    };
  }, []);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedPhotos(prev => [...prev, {
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          base64Data: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!selectedMachineId || !selectedCategoryId || !breakdownReason || !breakdownDescription) {
      alert('Please fill all mandatory fields marked with an asterisk (*).');
      return;
    }

    try {
      setSubmitting(true);
      const created = await TicketsAPI.create({
        machineId: parseInt(selectedMachineId),
        categoryId: parseInt(selectedCategoryId),
        breakdownOccurredAt: new Date(occurredAt).toISOString(),
        machineCondition,
        productionImpact,
        priority,
        breakdownReason,
        breakdownDescription,
        attachments: attachedPhotos
      });

      setSuccessMessage(`Ticket ${created.ticketNumber} successfully submitted to Maintenance!`);
      // Reset form
      setSelectedMachineId('');
      setBreakdownReason('');
      setBreakdownDescription('');
      setAttachedPhotos([]);
      await loadData();
      setActiveTab('active');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeTickets = tickets.filter(t => t.currentStatus !== 'CLOSED' && t.currentStatus !== 'CANCELLED');
  const verificationQueue = tickets.filter(t => t.currentStatus === 'AWAITING_SUPERVISOR');
  const filteredTickets = (activeTab === 'pending_verification' ? verificationQueue : activeTickets)
    .filter(t =>
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
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Production Dashboard — Shift Breakdown Operations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pune Plant #1 • Chakan Industrial Area • Shift Supervisor: <span className="font-bold text-emerald-800">{user?.employeeName || 'Amit Verma'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'new_ticket' ? (
            <button
              onClick={() => setActiveTab('new_ticket')}
              className="px-5 py-2.5 rounded-2xl bg-[#0e4d2a] hover:bg-[#07351b] text-white font-bold text-xs shadow-md shadow-[#0e4d2a]/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Report Machine Breakdown</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('active')}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Back to Stoppages
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tabs & Search Bar */}
      {activeTab !== 'new_ticket' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'active'
                  ? 'bg-[#0e4d2a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Active Stoppages ({activeTickets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pending_verification')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'pending_verification'
                  ? 'bg-[#1ea751] text-white shadow-xs ring-2 ring-[#1ea751]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Needs My Verification ({verificationQueue.length})</span>
              {verificationQueue.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search machine, ticket, symptom..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] w-full sm:w-64"
            />
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-950 font-bold text-sm">×</button>
        </div>
      )}

      {/* VIEW 1: REPORT NEW BREAKDOWN FORM (Clean, Guided 3-Section Layout) */}
      {activeTab === 'new_ticket' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Record Breakdown Incident Intake
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitting alerts Maintenance Incharge dispatch queue immediately and starts downtime calculation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('active')}
              className="text-xs text-slate-500 hover:text-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-6">

            {/* Section 1: Target Asset & Timing */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#0e4d2a]" />
                1. Machine Asset & Incident Timestamp
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Target Machine *
                  </label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => {
                      setSelectedMachineId(e.target.value);
                      const m = machines.find(x => x.machineId === parseInt(e.target.value));
                      if (m && m.criticality === 'CRITICAL') {
                        setPriority('CRITICAL');
                        setProductionImpact('CRITICAL');
                      }
                    }}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  >
                    <option value="">-- Select Machine from Factory Roster --</option>
                    {machines.map(m => (
                      <option key={m.machineId} value={m.machineId}>
                        {m.machineCode} — {m.machineName} ({m.departmentName}) [{m.criticality}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Breakdown Occurred Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] font-mono shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Failure Classification & Urgency */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                2. Classification & Production Urgency
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Failure Category *
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName} ({c.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Machine Condition *
                  </label>
                  <select
                    value={machineCondition}
                    onChange={(e) => setMachineCondition(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  >
                    <option value="STOPPED">Stopped (Complete Line Halt)</option>
                    <option value="PARTIALLY_WORKING">Partially Working</option>
                    <option value="RUNNING_ABNORMALLY">Running Abnormally (Vibration/Noise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Priority / Impact Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setProductionImpact(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  >
                    <option value="CRITICAL">CRITICAL (Line Bottleneck)</option>
                    <option value="HIGH">HIGH (Assembly Impact)</option>
                    <option value="MEDIUM">MEDIUM (Standard Operation)</option>
                    <option value="LOW">LOW (Auxiliary Unit)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Symptom Description & Photo Attachment */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-800" />
                3. Primary Symptom & Context
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Breakdown Reason / Symptom *
                </label>
                <input
                  type="text"
                  value={breakdownReason}
                  onChange={(e) => setBreakdownReason(e.target.value)}
                  placeholder="e.g. Spindle drive overheating trip, Hydraulic pressure drop, Sensor malfunction..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Detailed Description & Observations *
                </label>
                <textarea
                  value={breakdownDescription}
                  onChange={(e) => setBreakdownDescription(e.target.value)}
                  placeholder="Describe abnormal sounds, smoke, error codes displayed on panel, or specific part observed before stoppage..."
                  rows={3}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Attach Pre-Repair Machine Photographs
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-[#0e4d2a] file:border file:border-emerald-300 hover:file:bg-emerald-50 cursor-pointer"
                  />
                  {attachedPhotos.length > 0 && (
                    <span className="text-xs text-emerald-800 font-bold">
                      {attachedPhotos.length} photo(s) selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-2xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-black shadow-lg shadow-[#0e4d2a]/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
              >
                {submitting ? 'Submitting to LAN...' : 'Submit Breakdown Incident'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* VIEW 2: ACTIVE BREAKDOWN TICKETS LIST (Crisp White Cards) */}
      {activeTab !== 'new_ticket' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((t) => {
            const needsMyVerification = t.currentStatus === 'AWAITING_SUPERVISOR';
            return (
              <div
                key={t.ticketId}
                onClick={() => setSelectedTicketId(t.ticketId)}
                className={`bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group border ${
                  needsMyVerification
                    ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 hover:border-emerald-500/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {t.ticketNumber}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>

                  <div className="mb-2.5">
                    <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                      {t.machineCode}
                    </h3>
                    <p className="text-xs text-slate-500">{t.machineName}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 mb-3.5 line-clamp-2">
                    {t.breakdownReason}
                  </div>

                  {/* Assigned Mechanic Contact Pill */}
                  {t.assignedMechanicName ? (
                    <div className="flex items-center justify-between bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-200 text-xs mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px]">
                          {t.assignedMechanicName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{t.assignedMechanicName}</div>
                          <div className="text-[10px] text-slate-500">{t.assignedMechanicSpecialization || 'Technician'}</div>
                        </div>
                      </div>
                      {t.assignedMechanicMobile && (
                        <a
                          href={`tel:${t.assignedMechanicMobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-emerald-800 text-white hover:bg-emerald-950 transition-colors"
                          title={`Call ${t.assignedMechanicMobile}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Technician Dispatch
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.currentStatus} />
                    <span className="font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200 text-[11px]">
                      {t.totalDowntimeMinutes}m
                    </span>
                  </div>

                  {needsMyVerification ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicketId(t.ticketId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify & Sign</span>
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No active breakdown tickets found</p>
              <p className="text-xs text-slate-500 mt-1">All production assets in this department are running normally.</p>
            </div>
          )}
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
