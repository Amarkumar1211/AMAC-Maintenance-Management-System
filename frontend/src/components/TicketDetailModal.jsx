import React, { useState, useEffect } from 'react';
import { TicketsAPI, MastersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SignaturePad from './SignaturePad';
import BreakdownSlipModal from './BreakdownSlipModal';
import {
  X,
  Clock,
  User,
  Phone,
  Wrench,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  AlertTriangle,
  Layers,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Check,
  Pause,
  Play,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Cpu,
  Package,
  Eye,
  Printer
} from 'lucide-react';

export default function TicketDetailModal({ ticketId, onClose, onRefresh }) {
  const { user, hasRole } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Active view tab inside modal: 'details', 'repair', 'approvals', 'history'
  const [activeTab, setActiveTab] = useState('details');

  // Inline Action Panel state: null | 'assign' | 'complete' | 'approval' | 'pause' | 'reopen' | 'cancel'
  const [activeAction, setActiveAction] = useState(null);

  // Master data for actions
  const [mechanicsList, setMechanicsList] = useState([]);
  const [sparePartsList, setSparePartsList] = useState([]);

  // Form states for Assignment
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');

  // Form states for Complete Repair
  const [inspectionFindings, setInspectionFindings] = useState('');
  const [actualRootCause, setActualRootCause] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [postCondition, setPostCondition] = useState('RUNNING_NORMAL');
  const [mechanicRemarks, setMechanicRemarks] = useState('');
  const [consumedParts, setConsumedParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState(1);
  const [repairPhotos, setRepairPhotos] = useState([]);

  // Form states for Approval & Signatures
  const [approvalStage, setApprovalStage] = useState('SUPERVISOR');
  const [approvalStatus, setApprovalStatus] = useState('APPROVED');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [signatureData, setSignatureData] = useState({ type: 'DRAWN', base64: null, hasSignature: false });

  // Form states for Pause, Reopen, Cancel
  const [pauseReason, setPauseReason] = useState('Awaiting Spare Parts');
  const [pauseNotes, setPauseNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await TicketsAPI.getById(ticketId);
      setTicket(data);
      // Auto-switch tab based on status if appropriate
      if (data.currentStatus === 'AWAITING_SUPERVISOR' || data.currentStatus === 'AWAITING_INCHARGE') {
        setActiveTab('approvals');
      } else if (data.actions && data.actions.length > 0) {
        setActiveTab('repair');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadMastersForActions = async () => {
    try {
      const [mechs, parts] = await Promise.all([
        MastersAPI.getMechanics(false),
        MastersAPI.getSpareParts()
      ]);
      setMechanicsList(mechs);
      setSparePartsList(parts);
    } catch (err) {
      console.error(err);
    }
  };

  const openInlineAction = (actionName) => {
    loadMastersForActions();
    setActiveAction(actionName);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMechanicId) return;
    try {
      setActionSubmitting(true);
      await TicketsAPI.assign(ticket.ticketId, parseInt(selectedMechanicId), assignRemarks);
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleAcceptJob = async () => {
    try {
      setActionSubmitting(true);
      await TicketsAPI.accept(ticket.ticketId);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionSubmitting(true);
      await TicketsAPI.startWork(ticket.ticketId, 'Technician began active repair work.');
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handlePauseWorkSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      await TicketsAPI.pauseWork(ticket.ticketId, pauseReason, pauseNotes);
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResumeWork = async () => {
    try {
      setActionSubmitting(true);
      await TicketsAPI.resumeWork(ticket.ticketId, 'Work resumed after hold.');
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleAddPartToConsumed = () => {
    if (!selectedPartId || selectedPartQty <= 0) return;
    const part = sparePartsList.find(p => p.partId === parseInt(selectedPartId));
    if (!part) return;

    setConsumedParts(prev => [...prev, {
      partId: part.partId,
      partCode: part.partCode,
      partName: part.partName,
      unit: part.unit,
      quantity: parseFloat(selectedPartQty),
      remarks: 'Replaced during corrective repair'
    }]);
    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  const handleRemovePartFromConsumed = (index) => {
    setConsumedParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleRepairPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setRepairPhotos(prev => [...prev, {
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          base64Data: reader.result,
          attachmentType: 'REPAIR'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      alert('Please describe the action taken.');
      return;
    }

    try {
      setActionSubmitting(true);
      await TicketsAPI.completeWork(ticket.ticketId, {
        inspectionFindings,
        actualRootCause,
        actionTaken,
        machineConditionAfterRepair: postCondition,
        mechanicRemarks,
        partsUsed: consumedParts.map(p => ({
          partId: p.partId,
          quantity: p.quantity,
          remarks: p.remarks
        })),
        repairAttachments: repairPhotos
      });
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const startApproval = (stage, status = 'APPROVED') => {
    setApprovalStage(stage);
    setApprovalStatus(status);
    setApprovalRemarks('');
    setSignatureData({ type: 'DRAWN', base64: null, hasSignature: false });
    setActiveAction('approval');
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (approvalStatus === 'REJECTED' && !approvalRemarks.trim()) {
      alert('A reason is mandatory when rejecting a repair.');
      return;
    }

    if (approvalStatus === 'APPROVED' && !signatureData.hasSignature) {
      alert('Please provide a digital signature before approving.');
      return;
    }

    try {
      setActionSubmitting(true);
      await TicketsAPI.approve(ticket.ticketId, {
        stage: approvalStage,
        status: approvalStatus,
        remarks: approvalRemarks,
        signatureType: signatureData.type,
        signatureBase64: signatureData.base64,
        productionRestoredAt: approvalStage === 'SUPERVISOR' && approvalStatus === 'APPROVED' ? new Date().toISOString() : null
      });
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      alert('Reason for reopening is required.');
      return;
    }
    try {
      setActionSubmitting(true);
      await TicketsAPI.reopen(ticket.ticketId, reopenReason);
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Reason for cancellation is required.');
      return;
    }
    try {
      setActionSubmitting(true);
      await TicketsAPI.cancel(ticket.ticketId, cancelReason);
      setActiveAction(null);
      await loadTicket();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await TicketsAPI.addComment(ticket.ticketId, newComment);
      setTicket(prev => ({
        ...prev,
        comments: [...(prev.comments || []), added]
      }));
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!ticketId) return null;

  // Calculate Stepper State (5 standard stages)
  // Stage 1: Reported (NEW)
  // Stage 2: Mechanic Dispatched (ASSIGNED, ACCEPTED)
  // Stage 3: Repair Active (IN_PROGRESS, ON_HOLD)
  // Stage 4: Supervisor Verification (AWAITING_SUPERVISOR)
  // Stage 5: Incharge Closure / Closed (AWAITING_INCHARGE, CLOSED)
  const getStepperIndex = (status) => {
    if (status === 'NEW') return 1;
    if (status === 'ASSIGNED' || status === 'ACCEPTED') return 2;
    if (status === 'IN_PROGRESS' || status === 'ON_HOLD') return 3;
    if (status === 'AWAITING_SUPERVISOR' || status === 'SUPERVISOR_REJECTED') return 4;
    if (status === 'AWAITING_INCHARGE' || status === 'INCHARGE_REJECTED' || status === 'CLOSED') return 5;
    return 1;
  };
  const stepIndex = ticket ? getStepperIndex(ticket.currentStatus) : 1;

  const isClosed = ticket?.currentStatus === 'CLOSED';
  const isCancelled = ticket?.currentStatus === 'CANCELLED';

  const isAssignedMechanic = ticket?.currentAssignment?.mechanicId && user?.mechanicId === ticket.currentAssignment.mechanicId;
  const canMechanicAct = isAssignedMechanic || hasRole('ADMIN');
  const canSupervisorAct = hasRole('SUPERVISOR') || hasRole('ADMIN');
  const canInchargeAct = hasRole('MAINTENANCE_INCHARGE') || hasRole('ADMIN');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800">

        {/* 1. TOP HEADER BAR */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0a4423] text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
              {ticket?.ticketNumber ? ticket.ticketNumber.slice(-4) : 'MBMS'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900">
                  {ticket?.ticketNumber}
                </span>
                {ticket && <StatusBadge status={ticket.currentStatus} size="sm" />}
                {ticket && <PriorityBadge priority={ticket.priority} />}
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold font-mono">
                  Cycle #{ticket?.currentApprovalRound || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                <span className="font-bold text-slate-800">{ticket?.machineCode}</span>
                <span>•</span>
                <span>{ticket?.machineName}</span>
                <span>•</span>
                <span className="text-emerald-800 font-semibold">{ticket?.departmentName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Standard Breakdown Slip / Coupon Button */}
            {ticket && (
              <button
                onClick={() => setShowSlipModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Print ISO Standard Breakdown Coupon & Intimation Slip"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-800" />
                <span className="hidden sm:inline">Print Coupon</span>
              </button>
            )}

            {/* Real-time Downtime Indicator */}
            {ticket && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
                <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{ticket.totalDowntimeMinutes}m downtime</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. VISUAL 5-STEP LIFECYCLE PROGRESS BAR */}
        {ticket && !isCancelled && (
          <div className="bg-slate-100/70 px-5 py-3 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold max-w-3xl mx-auto">
              {[
                { label: '1. Reported', step: 1 },
                { label: '2. Dispatched', step: 2 },
                { label: '3. Repair Active', step: 3 },
                { label: '4. Supervisor Test', step: 4 },
                { label: '5. Incharge Sign-off', step: 5 },
              ].map((s, idx) => {
                const isPassed = stepIndex > s.step || isClosed;
                const isCurrent = stepIndex === s.step && !isClosed;
                return (
                  <div key={s.step} className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isPassed
                          ? 'bg-[#0e4d2a] text-white shadow-xs'
                          : isCurrent
                            ? 'bg-[#1ea751] text-white ring-4 ring-[#1ea751]/20 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <span
                      className={`hidden sm:inline ${isCurrent ? 'font-bold text-[#0e4d2a]' : isPassed ? 'text-slate-800' : 'text-slate-400'
                        }`}
                    >
                      {s.label}
                    </span>
                    {idx < 4 && <div className="w-4 sm:w-10 h-0.5 bg-slate-200 mx-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. PRIMARY ACTION HIGHLIGHT BANNER (If an action is waiting for the user) */}
        {ticket && !activeAction && !isClosed && !isCancelled && (
          <div className="bg-emerald-50/80 border-b border-emerald-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1ea751] animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Current Action Needed: </span>
                <span className="text-emerald-900 font-semibold">
                  {ticket.currentStatus === 'NEW' && 'Awaiting Maintenance Incharge to assign a technician.'}
                  {ticket.currentStatus === 'ASSIGNED' && `Dispatched to ${ticket.assignedMechanicName || 'Technician'} — Awaiting acceptance.`}
                  {ticket.currentStatus === 'ACCEPTED' && 'Technician accepted job — Ready to start maintenance work.'}
                  {ticket.currentStatus === 'IN_PROGRESS' && 'Repair is actively underway on the plant floor.'}
                  {ticket.currentStatus === 'ON_HOLD' && 'Repair is temporarily paused.'}
                  {ticket.currentStatus === 'AWAITING_SUPERVISOR' && 'Repair completed by technician — Awaiting Supervisor trial check & digital sign-off.'}
                  {ticket.currentStatus === 'AWAITING_INCHARGE' && 'Supervisor verified machine — Awaiting Maintenance Incharge final engineering closure.'}
                </span>
              </div>
            </div>

            {/* Quick Action Trigger Buttons */}
            <div className="flex items-center gap-2">
              {ticket.currentStatus === 'NEW' && hasRole('MAINTENANCE_INCHARGE') && (
                <button
                  onClick={() => openInlineAction('assign')}
                  className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Assign Technician
                </button>
              )}

              {ticket.currentStatus === 'ASSIGNED' && (
                canMechanicAct ? (
                  <button
                    onClick={handleAcceptJob}
                    disabled={actionSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Job
                  </button>
                ) : (
                  <span className="text-xs text-emerald-900 font-semibold bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-xl">
                    Assigned to {ticket.assignedMechanicName || 'Technician'}
                  </span>
                )
              )}

              {ticket.currentStatus === 'ACCEPTED' && (
                canMechanicAct ? (
                  <button
                    onClick={handleStartWork}
                    disabled={actionSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Repair Work
                  </button>
                ) : (
                  <span className="text-xs text-emerald-900 font-semibold bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-xl">
                    Accepted by {ticket.assignedMechanicName || 'Technician'}
                  </span>
                )
              )}

              {ticket.currentStatus === 'IN_PROGRESS' && (
                canMechanicAct ? (
                  <>
                    <button
                      onClick={() => openInlineAction('pause')}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Put On Hold
                    </button>
                    <button
                      onClick={() => openInlineAction('complete')}
                      className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Log Repair & Consumed Parts
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-amber-900 font-semibold bg-amber-100/70 border border-amber-300 px-3 py-1 rounded-xl">
                    Under repair by {ticket.assignedMechanicName || 'Technician'}
                  </span>
                )
              )}

              {ticket.currentStatus === 'ON_HOLD' && (
                canMechanicAct ? (
                  <button
                    onClick={handleResumeWork}
                    disabled={actionSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume Work
                  </button>
                ) : (
                  <span className="text-xs text-amber-900 font-semibold bg-amber-100/70 border border-amber-300 px-3 py-1 rounded-xl">
                    Repair on hold
                  </span>
                )
              )}

              {ticket.currentStatus === 'AWAITING_SUPERVISOR' && (
                canSupervisorAct ? (
                  <>
                    <button
                      onClick={() => startApproval('SUPERVISOR', 'APPROVED')}
                      className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify Machine & Sign
                    </button>
                    <button
                      onClick={() => startApproval('SUPERVISOR', 'REJECTED')}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject (Rework)
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-emerald-900 font-semibold bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-xl">
                    Awaiting Supervisor Trial Run
                  </span>
                )
              )}

              {ticket.currentStatus === 'AWAITING_INCHARGE' && (
                canInchargeAct ? (
                  <>
                    <button
                      onClick={() => startApproval('INCHARGE', 'APPROVED')}
                      className="px-4 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Execute Final Sign-off & Close
                    </button>
                    <button
                      onClick={() => startApproval('INCHARGE', 'REJECTED')}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Return to Maint
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-emerald-900 font-semibold bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-xl">
                    Awaiting Incharge Sign-off
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* 4. INLINE ACTION PANEL (Replaces Disorienting Nested Modals) */}
        {activeAction && (
          <div className="bg-emerald-50/60 border-b-2 border-[#1ea751] p-5 animate-in slide-in-from-top duration-200 shrink-0 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0e4d2a] text-white flex items-center justify-center">
                  {activeAction === 'assign' && <Wrench className="w-4 h-4" />}
                  {activeAction === 'complete' && <CheckCircle className="w-4 h-4" />}
                  {activeAction === 'approval' && <ShieldCheck className="w-4 h-4" />}
                  {activeAction === 'pause' && <Pause className="w-4 h-4" />}
                  {activeAction === 'reopen' && <RotateCcw className="w-4 h-4" />}
                  {activeAction === 'cancel' && <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeAction === 'assign' && 'Assign Field Technician to Breakdown'}
                    {activeAction === 'complete' && 'Log Repair Completion, Root Cause & Spare Parts Consumed'}
                    {activeAction === 'approval' && (approvalStage === 'SUPERVISOR' ? 'Supervisor Physical Verification & Signature' : 'Maintenance Incharge Engineering Sign-off & Closure')}
                    {activeAction === 'pause' && 'Put Maintenance Repair On Hold'}
                    {activeAction === 'reopen' && 'Reopen Closed Breakdown Ticket'}
                    {activeAction === 'cancel' && 'Cancel Breakdown Incident'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fill the required details below to update the system and notify personnel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel / Return
              </button>
            </div>

            {/* ACTION A: ASSIGN TECHNICIAN */}
            {activeAction === 'assign' && (
              <form onSubmit={handleAssignSubmit} className="space-y-4 max-w-2xl">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Select Technician *
                  </label>
                  <select
                    value={selectedMechanicId}
                    onChange={(e) => setSelectedMechanicId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  >
                    <option value="">-- Choose Mechanic from Roster --</option>
                    {mechanicsList.map(m => (
                      <option key={m.mechanicId} value={m.mechanicId}>
                        {m.employeeName} ({m.specialization || 'General'}) • Active Jobs: {m.activeTicketCount} • Shift: {m.shiftName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Job Priority Instructions / Notes
                  </label>
                  <textarea
                    value={assignRemarks}
                    onChange={(e) => setAssignRemarks(e.target.value)}
                    placeholder="e.g. Bring hydraulic test kit, verify pressure gauge readings..."
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedMechanicId || actionSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                  >
                    {actionSubmitting ? 'Dispatching...' : 'Confirm Dispatch'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION B: COMPLETE WORK & SPARE PARTS */}
            {activeAction === 'complete' && (
              <form onSubmit={handleCompleteSubmit} className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Inspection Findings
                    </label>
                    <textarea
                      value={inspectionFindings}
                      onChange={(e) => setInspectionFindings(e.target.value)}
                      placeholder="What was physically found during machine check..."
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-amber-900 block mb-1">
                      Actual Root Cause *
                    </label>
                    <textarea
                      value={actualRootCause}
                      onChange={(e) => setActualRootCause(e.target.value)}
                      placeholder="e.g. Oil seal rupture due to thermal fatigue..."
                      rows={2}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-950 block mb-1">
                    Corrective Action Executed *
                  </label>
                  <textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Specific engineering steps taken to rectify the problem..."
                    rows={2}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>

                {/* Spare Parts Logging Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#0e4d2a]" />
                    Record Consumed Spare Parts (Deducted from Plant Inventory)
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                    >
                      <option value="">-- Select Spare Part from Catalogue --</option>
                      {sparePartsList.map(p => (
                        <option key={p.partId} value={p.partId}>
                          {p.partCode} — {p.partName} (Stock: {p.stockQuantity} {p.unit})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={selectedPartQty}
                        onChange={(e) => setSelectedPartQty(e.target.value)}
                        className="w-20 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-[#0e4d2a]"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={handleAddPartToConsumed}
                        className="px-4 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Part
                      </button>
                    </div>
                  </div>

                  {consumedParts.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {consumedParts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                          <div>
                            <span className="font-mono font-bold text-emerald-800 mr-2">{p.partCode}</span>
                            <span className="font-medium text-slate-800">{p.partName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-slate-900">{p.quantity} {p.unit}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePartFromConsumed(idx)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No spare parts added yet (optional if no parts replaced).</p>
                  )}
                </div>

                {/* Repair Photo Upload */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Upload Repair Photographs (Post-repair machine condition)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleRepairPhotoUpload}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-[#0e4d2a] file:border file:border-emerald-300 hover:file:bg-emerald-50 cursor-pointer"
                  />
                  {repairPhotos.length > 0 && (
                    <span className="text-xs text-emerald-800 font-bold block mt-1">
                      {repairPhotos.length} photo(s) selected
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-6 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                  >
                    {actionSubmitting ? 'Submitting...' : 'Submit Repair for Supervisor Verification'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION C: APPROVAL & DIGITAL SIGNATURE */}
            {activeAction === 'approval' && (
              <form onSubmit={handleApprovalSubmit} className="space-y-4 max-w-2xl">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Verification Remarks {approvalStatus === 'REJECTED' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder={
                      approvalStatus === 'APPROVED'
                        ? 'e.g. Machine trial tested at full load for 15 mins. No abnormal noise or vibration observed. Production cleared.'
                        : 'e.g. Spindle still vibrating above threshold. Further balancing required.'
                    }
                    rows={2}
                    required={approvalStatus === 'REJECTED'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a] shadow-xs"
                  />
                </div>

                {approvalStatus === 'APPROVED' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <SignaturePad
                      label={`${approvalStage === 'SUPERVISOR' ? 'Supervisor' : 'Maintenance Incharge'} Digital Signature`}
                      onSignatureChange={setSignatureData}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className={`px-6 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-40 ${approvalStatus === 'APPROVED'
                        ? 'bg-[#0e4d2a] hover:bg-[#07351b]'
                        : 'bg-[#e04f44] hover:bg-[#c93c31]'
                      }`}
                  >
                    {actionSubmitting
                      ? 'Signing...'
                      : approvalStatus === 'APPROVED'
                        ? 'Confirm & Digitally Sign'
                        : 'Confirm Rejection (Return for Rework)'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION D: PAUSE WORK (HOLD) */}
            {activeAction === 'pause' && (
              <form onSubmit={handlePauseWorkSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Reason for Hold *</label>
                  <select
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  >
                    <option value="Awaiting Spare Parts">Awaiting Spare Parts</option>
                    <option value="Shift Handover">Shift Handover</option>
                    <option value="Specialized Tooling Required">Specialized Tooling Required</option>
                    <option value="Safety Clearance Pending">Safety Clearance Pending</option>
                    <option value="Higher Priority Emergency">Higher Priority Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Notes</label>
                  <textarea
                    value={pauseNotes}
                    onChange={(e) => setPauseNotes(e.target.value)}
                    placeholder="Provide details regarding the pause..."
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
                  >
                    {actionSubmitting ? 'Pausing...' : 'Confirm Hold'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION E: REOPEN TICKET */}
            {activeAction === 'reopen' && (
              <form onSubmit={handleReopenSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Reason for Reopening *</label>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="e.g. Machine failed again after 20 minutes of production trial run..."
                    rows={2}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md"
                  >
                    {actionSubmitting ? 'Reopening...' : 'Confirm Reopen'}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION F: CANCEL TICKET */}
            {activeAction === 'cancel' && (
              <form onSubmit={handleCancelSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Reason for Cancellation *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Logged in error / duplicate breakdown ticket..."
                    rows={2}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#e04f44] hover:bg-[#c93c31] text-white text-xs font-bold shadow-md"
                  >
                    {actionSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 5. SEGMENTED TABS BAR (Clean Information Architecture) */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'details', label: 'Incident & Machine', icon: AlertTriangle },
              { id: 'repair', label: 'Repair & Spare Parts', icon: Wrench, count: ticket?.actions?.length },
              { id: 'approvals', label: 'Dual Approvals & Signatures', icon: ShieldCheck, count: ticket?.approvals?.length },
              { id: 'history', label: 'Audit Log & Discussion', icon: Layers, count: ticket?.comments?.length },
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isActive
                      ? 'bg-[#0e4d2a] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick auxiliary actions (Cancel / Reopen / Reassign) */}
          <div className="flex items-center gap-2">
            {isClosed && (
              <button
                onClick={() => openInlineAction('reopen')}
                className="px-3 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reopen
              </button>
            )}
            {!isClosed && !isCancelled && hasRole('MAINTENANCE_INCHARGE') && (
              <button
                onClick={() => openInlineAction('cancel')}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
              >
                Cancel Ticket
              </button>
            )}
          </div>
        </div>

        {/* 6. TAB CONTENT PANELS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RotateCcw className="w-8 h-8 animate-spin text-[#0e4d2a] mr-3" />
              <span>Loading breakdown record and approval history...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          ) : ticket ? (
            <>
              {/* TAB 1: INCIDENT & MACHINE DETAILS */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left: Machine specs & Supervisor details */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Reported Failure Symptom & Context
                      </h4>

                      <div>
                        <span className="text-[11px] text-slate-500 font-medium">Primary Breakdown Symptom:</span>
                        <p className="font-bold text-sm text-slate-900 bg-white p-3 rounded-xl border border-slate-200 mt-1">
                          {ticket.breakdownReason}
                        </p>
                      </div>

                      {ticket.breakdownDescription && (
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium">Detailed Context:</span>
                          <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                            {ticket.breakdownDescription}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">Occurred At</span>
                          <strong className="text-slate-800 font-mono">
                            {new Date(ticket.breakdownOccurredAt).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Reported By</span>
                          <strong className="text-slate-800">{ticket.supervisorName || 'Supervisor'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Machine Condition</span>
                          <strong className="text-slate-800 uppercase">{ticket.machineCondition || 'STOPPED'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Pre-repair Breakdown Photos */}
                    {ticket.attachments?.filter(a => a.attachmentType === 'BREAKDOWN').length > 0 && (
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />
                          Pre-repair Machine Photographs
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {ticket.attachments.filter(a => a.attachmentType === 'BREAKDOWN').map(att => (
                            <a
                              key={att.attachmentId}
                              href={`/api/files/view?path=${encodeURIComponent(att.filePath)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-white hover:border-[#1ea751] transition-all shadow-xs"
                            >
                              <img
                                src={`/api/files/view?path=${encodeURIComponent(att.filePath)}`}
                                alt="Breakdown condition"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                                View Full
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Machine Asset card & Assigned Technician */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Machine Asset Card */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <Cpu className="w-3.5 h-3.5 text-[#0e4d2a]" />
                        Machine Master Asset Information
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Asset Code:</span>
                          <strong className="font-mono text-emerald-800">{ticket.machineCode}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Machine Name:</span>
                          <strong className="text-slate-800 text-right">{ticket.machineName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department:</span>
                          <strong className="text-slate-800">{ticket.departmentName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Failure Category:</span>
                          <strong className="text-emerald-800">{ticket.categoryName}</strong>
                        </div>
                        {ticket.machineLocation && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Location Bay:</span>
                            <strong className="text-slate-800">{ticket.machineLocation}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Mechanic Contact Card */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-[#0e4d2a]" />
                          Assigned Technician
                        </h4>
                        {hasRole('MAINTENANCE_INCHARGE') && !isClosed && !isCancelled && (
                          <button
                            onClick={() => openInlineAction('assign')}
                            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
                          >
                            {ticket.currentAssignment ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </div>

                      {ticket.currentAssignment ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center font-bold text-sm">
                              {ticket.currentAssignment.employeeName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{ticket.currentAssignment.employeeName}</div>
                              <div className="text-[10px] text-slate-500">
                                {ticket.currentAssignment.employeeCode} • {ticket.currentAssignment.specialization}
                              </div>
                            </div>
                          </div>

                          {ticket.currentAssignment.mobileNumber && (
                            <a
                              href={`tel:${ticket.currentAssignment.mobileNumber}`}
                              className="px-3 py-1.5 rounded-lg bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          No technician assigned yet. Maintenance Incharge triage pending.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REPAIR & SPARE PARTS */}
              {activeTab === 'repair' && (
                <div className="space-y-4">
                  {ticket.actions && ticket.actions.length > 0 ? (
                    ticket.actions.map((act) => (
                      <div key={act.actionId} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0e4d2a] flex items-center justify-center font-bold text-xs">
                              #{act.approvalRound}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">
                                Repair Executed by {act.mechanicName}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Machine Post-Condition: <strong className="text-emerald-800">{act.machineConditionAfterRepair}</strong>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(act.completedAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {act.actualRootCause && (
                            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
                              <span className="font-bold text-amber-900 block">Identified Root Cause:</span>
                              <p className="text-slate-800">{act.actualRootCause}</p>
                            </div>
                          )}

                          <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-emerald-950 block">Corrective Action Taken:</span>
                            <p className="text-slate-800">{act.actionTaken}</p>
                          </div>
                        </div>

                        {act.inspectionFindings && (
                          <div className="text-xs bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-semibold block mb-0.5">Physical Findings:</span>
                            <p className="text-slate-800">{act.inspectionFindings}</p>
                          </div>
                        )}

                        {/* Spare Parts Consumed Table */}
                        {act.partsUsed && act.partsUsed.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-[#0e4d2a]" />
                              Spare Parts Consumed During Repair
                            </span>
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-semibold">
                                  <tr>
                                    <th className="p-2.5">Part Code</th>
                                    <th className="p-2.5">Part Description</th>
                                    <th className="p-2.5 text-right">Quantity Consumed</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {act.partsUsed.map(pu => (
                                    <tr key={pu.partsUsedId} className="hover:bg-slate-50">
                                      <td className="p-2.5 font-mono text-emerald-800 font-bold">{pu.partCode}</td>
                                      <td className="p-2.5 text-slate-800">{pu.partName}</td>
                                      <td className="p-2.5 text-right font-bold text-slate-900">{pu.quantity} {pu.unit}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Repair Completion Photos */}
                        {ticket.attachments?.filter(a => a.attachmentType === 'REPAIR').length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />
                              Repair Verification Photos
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {ticket.attachments.filter(a => a.attachmentType === 'REPAIR').map(att => (
                                <a
                                  key={att.attachmentId}
                                  href={`/api/files/view?path=${encodeURIComponent(att.filePath)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-white hover:border-[#1ea751] transition-all shadow-xs"
                                >
                                  <img
                                    src={`/api/files/view?path=${encodeURIComponent(att.filePath)}`}
                                    alt="Repair confirmation"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                                    View Full
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                      <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No repair action logged yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Technician will document root cause, steps, and consumed parts upon work completion.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DUAL APPROVALS & SIGNATURES */}
              {activeTab === 'approvals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stage 1: Supervisor Verification */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Stage 1: Supervisor Verification
                      </h4>
                      {(() => {
                        const sup = ticket.approvals?.find(a => a.approvalStage === 'SUPERVISOR');
                        if (sup) {
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sup.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-700 border border-rose-300'
                              }`}>
                              {sup.approvalStatus}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            Pending Trial
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const sup = ticket.approvals?.find(a => a.approvalStage === 'SUPERVISOR');
                      if (sup) {
                        return (
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-slate-500 block">Verified By:</span>
                              <strong className="text-slate-900">{sup.approverName}</strong>
                            </div>
                            {sup.remarks && (
                              <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-slate-500 font-semibold block mb-0.5">Remarks:</span>
                                <p className="text-slate-800">{sup.remarks}</p>
                              </div>
                            )}
                            {sup.signature && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200 inline-block shadow-2xs">
                                <img
                                  src={`/api/files/view?path=${encodeURIComponent(sup.signature.filePath)}`}
                                  alt="Supervisor signature"
                                  className="h-12 object-contain"
                                />
                                <div className="text-[9px] text-slate-400 font-mono mt-1 text-center">
                                  Signed: {new Date(sup.signature.signedAt).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Once technician finishes repair, the shift supervisor conducts a physical machine run trial and provides a digital signature before production restart.
                        </p>
                      );
                    })()}
                  </div>

                  {/* Stage 2: Maintenance Incharge Sign-off */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#0e4d2a]" />
                        Stage 2: Incharge Final Sign-off
                      </h4>
                      {(() => {
                        const inc = ticket.approvals?.find(a => a.approvalStage === 'INCHARGE');
                        if (inc) {
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${inc.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-700 border border-rose-300'
                              }`}>
                              {inc.approvalStatus}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                            Awaiting Stage 1
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const inc = ticket.approvals?.find(a => a.approvalStage === 'INCHARGE');
                      if (inc) {
                        return (
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-slate-500 block">Approved By:</span>
                              <strong className="text-slate-900">{inc.approverName}</strong>
                            </div>
                            {inc.remarks && (
                              <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-slate-500 font-semibold block mb-0.5">Remarks:</span>
                                <p className="text-slate-800">{inc.remarks}</p>
                              </div>
                            )}
                            {inc.signature && (
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200 inline-block shadow-2xs">
                                <img
                                  src={`/api/files/view?path=${encodeURIComponent(inc.signature.filePath)}`}
                                  alt="Incharge signature"
                                  className="h-12 object-contain"
                                />
                                <div className="text-[9px] text-slate-400 font-mono mt-1 text-center">
                                  Signed: {new Date(inc.signature.signedAt).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Maintenance Incharge performs final engineering review, executes digital signature, and permanently closes the incident to update plant MTTR and MTTF metrics.
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TIMELINE & TEAM COMMENTS */}
              {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Timeline */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-800" />
                      Immutable Status Transition History
                    </h4>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
                      {ticket.statusHistory?.map((sh) => (
                        <div key={sh.historyId} className="border-l-2 border-[#1ea751] pl-3 py-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sh.newStatus}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(sh.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            By {sh.changerName} {sh.changeRemarks && `— "${sh.changeRemarks}"`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Comments */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-800" />
                        Operational Discussion & Notes
                      </h4>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs mb-3">
                        {ticket.comments?.length > 0 ? (
                          ticket.comments.map(c => (
                            <div key={c.commentId} className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="font-bold text-emerald-900">{c.employeeName}</span>
                                <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-800">{c.commentText}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-slate-400 text-xs">No comments posted yet.</p>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add an operational remark..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a]"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 7. MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div>
            Logged-in Station: <strong className="text-slate-800">{user?.employeeName || 'User'}</strong> ({user?.roles?.join(', ') || 'Staff'})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Standard Breakdown Coupon / Work Slip Modal */}
      {showSlipModal && ticket && (
        <BreakdownSlipModal
          ticketId={ticket.ticketId}
          initialTicket={ticket}
          onClose={() => setShowSlipModal(false)}
        />
      )}
    </div>
  );
}