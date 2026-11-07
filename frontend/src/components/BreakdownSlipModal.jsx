import React, { useState, useEffect } from 'react';
import { TicketsAPI } from '../services/api';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  ShieldCheck, 
  QrCode,
  Download
} from 'lucide-react';

export default function BreakdownSlipModal({ ticketId, initialTicket, onClose }) {
  const [ticket, setTicket] = useState(initialTicket || null);
  const [loading, setLoading] = useState(!initialTicket);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticketId && (!initialTicket || initialTicket.ticketId !== ticketId)) {
      setLoading(true);
      TicketsAPI.getById(ticketId)
        .then(data => setTicket(data))
        .catch(err => setError(err.message || 'Failed to load breakdown slip data'))
        .finally(() => setLoading(false));
    }
  }, [ticketId, initialTicket]);

  const handlePrint = () => {
    window.print();
  };

  if (!ticket && loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-3">
          <Clock className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Generating Official Breakdown Coupon...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Error Loading Slip</h3>
          <p className="text-xs text-slate-600">{error || 'Breakdown slip not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isClosed = ticket.currentStatus === 'CLOSED';
  const supervisorApproval = ticket.approvals?.find(a => a.approvalStage === 'SUPERVISOR');
  const inchargeApproval = ticket.approvals?.find(a => a.approvalStage === 'INCHARGE');
  const primaryAction = ticket.actions?.[0];

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:bg-white print:fixed-none">
      
      {/* Outer Shell */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-300 print:border-none print:shadow-none print:rounded-none print:m-0 print:max-w-none">
        
        {/* Modal Toolbar (Hidden on Print) */}
        <div className="bg-[#0a4423] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-sans">
                Standard Breakdown Intimation Coupon & Work Slip
              </h3>
              <p className="text-[10px] text-emerald-200 font-mono">
                AMAC Unit 5 (U5) • Document Ref: AMAC/U5/MNT/FRM/01
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Print standard coupon on factory floor printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Coupon (A4 / Slip)</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close coupon view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE COUPON BODY (Standard ISO/IATF 16949 Industrial Format) */}
        <div 
          id="printable-breakdown-coupon"
          className="p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-4 text-[11px] leading-tight selection:bg-emerald-100"
        >
          {/* 1. OFFICIAL COMPANY DOCKET HEADER */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-slate-300 p-1 bg-white shrink-0 flex items-center justify-center">
                  <img src="/logo.jpg" alt="AMAC Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                    ASIAAN METALS & ALUMINIUM CASTING PVT. LTD.
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-900 tracking-wide uppercase">
                    Automotive & Industrial Casting Division • Unit 5 (U5)
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Total Productive Maintenance (TPM) • Integrated Breakdown Intimation System
                  </p>
                </div>
              </div>

              {/* Document Number & Barcode Block */}
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-4 min-w-[200px]">
                <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  DOC REF: AMAC/U5/MNT/FRM/01 • REV 03
                </div>
                <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-900 mt-0.5">
                  {ticket.ticketNumber}
                </div>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono border border-slate-900 bg-slate-100">
                  STATUS: {ticket.currentStatus}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="pt-2 text-center">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 underline decoration-slate-900 underline-offset-4">
                MACHINE BREAKDOWN INTIMATION & MAINTENANCE WORK ORDER COUPON
              </h2>
            </div>
          </div>

          {/* 2. SECTION A: ASSET, LOCATION & STAGES */}
          <div className="border border-slate-900 rounded-xl overflow-hidden mb-4">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-900 font-bold uppercase text-[10px] tracking-wider text-slate-800 flex items-center justify-between">
              <span>PART A: Target Asset & Production Intimation Record</span>
              <span className="font-mono text-[9px] text-slate-600">Generated: {new Date(ticket.reportedAt).toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-300 text-xs">
              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Machine Asset Code</span>
                <strong className="text-sm font-black font-mono text-emerald-900">{ticket.machineCode}</strong>
              </div>

              <div className="p-2.5 col-span-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Machine Asset Name & Model</span>
                <strong className="text-xs font-bold text-slate-900">{ticket.machineName}</strong>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Asset Criticality</span>
                <span className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded ${
                  ticket.machineCriticality === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' :
                  ticket.machineCriticality === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {ticket.machineCriticality}
                </span>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-800">{ticket.departmentName}</span>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Shop Floor Bay / Section</span>
                <strong className="font-bold text-slate-900 font-mono">
                  {ticket.sectionName ? `${ticket.sectionName} (${ticket.sectionCode || ''})` : 'Plant-Wide Utility'}
                </strong>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Breakdown Stoppage Time</span>
                <strong className="font-mono text-slate-900">{new Date(ticket.breakdownOccurredAt).toLocaleString()}</strong>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Machine Stoppage State</span>
                <strong className="font-bold text-red-700 uppercase">{ticket.machineCondition || 'STOPPED'}</strong>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Failure Category</span>
                <strong className="font-bold text-slate-800">{ticket.categoryName}</strong>
              </div>

              <div className="p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Production Line Urgency</span>
                <span className="font-bold text-slate-900 font-mono">{ticket.priority} PRIORITY</span>
              </div>

              <div className="p-2.5 col-span-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Shift & Intimating Supervisor</span>
                <span className="font-bold text-slate-900">{ticket.supervisorName}</span>
                {ticket.supervisorMobile && <span className="font-mono text-slate-500 text-[10px] ml-1.5">({ticket.supervisorMobile})</span>}
              </div>
            </div>
          </div>

          {/* 3. SECTION B: SYMPTOM & OPERATOR OBSERVATIONS */}
          <div className="border border-slate-900 rounded-xl overflow-hidden mb-4">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-900 font-bold uppercase text-[10px] tracking-wider text-slate-800">
              PART B: Observed Breakdown Symptom & Initial Pre-Repair Diagnostics
            </div>

            <div className="p-3 space-y-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Primary Breakdown Symptom:</span>
                <div className="font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 font-sans">
                  {ticket.breakdownReason}
                </div>
              </div>

              {ticket.breakdownDescription && (
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Detailed Operator Observations & Abnormal Sounds/Alarms:</span>
                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 whitespace-pre-wrap font-sans">
                    {ticket.breakdownDescription}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. SECTION C: MAINTENANCE HEAD DISPATCH & TECHNICIAN ASSIGNMENT */}
          <div className="border border-slate-900 rounded-xl overflow-hidden mb-4">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-900 font-bold uppercase text-[10px] tracking-wider text-slate-800 flex items-center justify-between">
              <span>PART C: Maintenance Head Command & Technician Allocation</span>
              <span className="font-mono text-[9px] text-slate-600">Maintenance Incharge: Manoj Kumar (EMP-INC-01)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 p-3 gap-3 sm:gap-0">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Assigned Technician</span>
                {ticket.currentAssignment ? (
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">{ticket.currentAssignment.employeeName}</strong>
                    <span className="text-[10px] text-slate-600 font-mono block">Code: {ticket.currentAssignment.employeeCode}</span>
                    <span className="text-[10px] text-emerald-800 font-semibold block">{ticket.currentAssignment.specialization || 'Maintenance Specialist'}</span>
                  </div>
                ) : (
                  <span className="text-amber-700 font-bold italic">Awaiting Technician Dispatch</span>
                )}
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Dispatch Allocation Time</span>
                <strong className="text-xs font-mono text-slate-900 block">
                  {ticket.currentAssignment?.assignedAt ? new Date(ticket.currentAssignment.assignedAt).toLocaleString() : 'Pending'}
                </strong>
                {ticket.currentAssignment?.acceptedAt && (
                  <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                    Accepted: {new Date(ticket.currentAssignment.acceptedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Maintenance Head Job Instructions</span>
                <p className="text-xs text-slate-700 italic">
                  {ticket.currentAssignment?.remarks || 'Carry necessary mechanical/electrical tools, inspect safety interlocks, restore line.'}
                </p>
              </div>
            </div>
          </div>

          {/* 5. SECTION D: REPAIR ACTION & SPARE PARTS (If Logged) */}
          {(primaryAction || ticket.actions?.length > 0) && (
            <div className="border border-slate-900 rounded-xl overflow-hidden mb-4">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-900 font-bold uppercase text-[10px] tracking-wider text-slate-800">
                PART D: Corrective Maintenance Record & Consumed Spare Parts
              </div>

              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Root Cause Identified:</span>
                    <p className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                      {primaryAction?.actualRootCause || 'Under technical evaluation'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Action Taken by Technician:</span>
                    <p className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                      {primaryAction?.actionTaken || 'Repair underway'}
                    </p>
                  </div>
                </div>

                {/* Spare Parts Consumed Table */}
                {primaryAction?.partsUsed?.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Spare Parts Consumed:</span>
                    <table className="w-full text-left text-[10px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">Part Code</th>
                          <th className="p-1.5">Description</th>
                          <th className="p-1.5 text-right">Qty</th>
                          <th className="p-1.5 text-right">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {primaryAction.partsUsed.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-bold text-emerald-900">{p.partCode}</td>
                            <td className="p-1.5 font-sans">{p.partName}</td>
                            <td className="p-1.5 text-right font-bold">{p.quantity} {p.unit}</td>
                            <td className="p-1.5 text-right font-sans">₹{p.unitPrice?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-200 font-mono text-[10px] text-slate-600">
                  <div>Cumulative Line Stoppage: <strong className="text-red-700 text-xs font-bold">{ticket.totalDowntimeMinutes} min</strong></div>
                  <div>MTTR (Repair Duration): <strong className="text-slate-900 text-xs">{ticket.mttrMinutes || primaryAction?.laborMinutes || ticket.activeLaborMinutes || 0} min</strong></div>
                  <div>Post-Repair Machine State: <strong className="text-emerald-800 font-bold">{primaryAction?.machineConditionAfterRepair || 'OPERATIONAL'}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* 6. SECTION E: DUAL SIGN-OFF & PHYSICAL AUTHORIZATION BOXES */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            {/* Shift Supervisor Sign-off */}
            <div className="border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-32">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                  1. Production Shift Supervisor Verification
                </span>
                <p className="font-bold text-slate-900 mt-1">{ticket.supervisorName}</p>
                <p className="text-[10px] text-slate-500">Trial test run inspection & handover</p>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">Supervisor Signature & Date</span>
                {supervisorApproval?.isApproved && (
                  <span className="text-emerald-800 font-mono font-bold">VERIFIED: {new Date(supervisorApproval.approvedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Maintenance Head Sign-off */}
            <div className="border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-32">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                  2. Maintenance Head Engineering Sign-off
                </span>
                <p className="font-bold text-slate-900 mt-1">Manoj Kumar (HOD Maintenance)</p>
                <p className="text-[10px] text-slate-500">Root-cause signoff & formal incident closure</p>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">Maintenance Head Signature & Stamp</span>
                {inchargeApproval?.isApproved && (
                  <span className="text-emerald-800 font-mono font-bold">APPROVED: {new Date(inchargeApproval.approvedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* 7. PERFORATED TEAR-STRIP FOR PHYSICAL SHOP FLOOR HANDOVER */}
          <div className="relative my-4 py-2 border-t-2 border-dashed border-slate-400 text-center font-mono text-[9px] uppercase tracking-widest text-slate-500">
            <span className="bg-white px-3 relative -top-3">
              ✂ - - - - - - - - - - TEAR SLIP: MAINTENANCE COUNTERFOIL / ACKNOWLEDGEMENT RECEIPT - - - - - - - - - - ✂
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] mt-1 text-slate-800">
              <div>
                <span className="text-slate-400 block text-[9px]">Coupon No:</span>
                <strong className="font-mono text-emerald-900">{ticket.ticketNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Target Machine:</span>
                <strong className="font-mono">{ticket.machineCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Intimation Date:</span>
                <span className="font-mono">{new Date(ticket.breakdownOccurredAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Maintenance Receiver:</span>
                <span className="font-bold">Manoj Kumar (HOD)</span>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-1">
            <span>AMAC Unit 5 (U5) • ISO 9001 / IATF 16949 Maintenance Record</span>
            <span>Printed from AMAC MBMS Shop Floor System • Factory Unit 5 (U5)</span>
          </div>

        </div>

      </div>
    </div>
  );
}
