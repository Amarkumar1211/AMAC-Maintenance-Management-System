import React, { useState, useEffect } from 'react';
import { ReportsAPI } from '../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  TrendingDown,
  Layers,
  Wrench,
  Percent,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

export default function ManagementReports() {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('overview'); // 'overview', 'machines', 'mechanics', 'sla', 'repeat'
  const [machineReports, setMachineReports] = useState([]);
  const [mechanicReports, setMechanicReports] = useState([]);
  const [slaReports, setSlaReports] = useState([]);
  const [repeatReports, setRepeatReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const [dash, mach, mech, sla, rep] = await Promise.all([
        ReportsAPI.getDashboard(),
        ReportsAPI.getMachines(),
        ReportsAPI.getMechanics(),
        ReportsAPI.getSla(),
        ReportsAPI.getRepeatBreakdowns()
      ]);
      setDashboardData(dash);
      setMachineReports(mach);
      setMechanicReports(mech);
      setSlaReports(sla);
      setRepeatReports(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const handleExport = (type) => {
    const url = ReportsAPI.exportCsvUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Top Banner (Theme Sample Style) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Reports & Dashboard — Downtime & Reliability Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live MTTR, MTTF, availability percentage, SLA compliance and repeat failure root-cause analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExport(activeReportTab === 'overview' ? 'tickets' : activeReportTab)}
            className="px-4 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white font-bold text-xs shadow-md shadow-[#0e4d2a]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Local CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (Crisp White Cards with MTTR & MTTF) */}
      {dashboardData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Total Incidents</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{dashboardData.totalTickets}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">Closed: {dashboardData.closedTickets}</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Total Downtime</div>
            <div className="text-2xl font-bold font-mono text-red-600 mt-1">{dashboardData.totalDowntimeHours} <span className="text-sm font-sans font-normal text-slate-500">hrs</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Cumulative loss</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Plant Availability</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{dashboardData.overallAvailabilityPercent}%</div>
            <div className="text-[10px] text-emerald-800 font-semibold mt-1">Operating uptime</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">MTTR (Repair Time)</div>
            <div className="text-2xl font-bold font-mono text-sky-700 mt-1">{dashboardData.averageMTTRMinutes} <span className="text-sm font-sans font-normal text-slate-500">min</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Active repair labor</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">MTTF (Time To Failure)</div>
            <div className="text-2xl font-bold font-mono text-teal-700 mt-1">{dashboardData.averageMTTFHours || (Math.round((720 - dashboardData.totalDowntimeHours) / Math.max(1, dashboardData.totalTickets) * 10) / 10)} <span className="text-sm font-sans font-normal text-slate-500">hrs</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Uptime between stops</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Avg Response Time</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{dashboardData.averageResponseTimeMinutes} <span className="text-sm font-sans font-normal text-slate-500">min</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Stoppage to technician</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Critical Breakdowns</div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1 flex items-center gap-1">
              <Flame className="w-5 h-5 text-rose-600" />
              {dashboardData.criticalIncidents}
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-1">Line bottlenecks</div>
          </div>
        </div>
      )}

      {/* Report Tab Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
        {[
          { id: 'overview', label: 'Dashboard & Visuals', icon: BarChart3 },
          { id: 'machines', label: 'Machine Breakdown Rankings', icon: Layers },
          { id: 'mechanics', label: 'Mechanic Performance Scorecard', icon: Wrench },
          { id: 'sla', label: 'SLA Breach Analysis', icon: Clock },
          { id: 'repeat', label: 'Repeat Failure Detector', icon: RotateCcw },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeReportTab === tab.id
                  ? 'bg-[#0e4d2a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISUALS & CHARTS */}
      {activeReportTab === 'overview' && dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Breakdown Categories Distribution */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Failure Category Distribution</span>
              <span className="text-xs text-slate-500 font-normal">Count & Downtime Loss</span>
            </h3>

            <div className="space-y-3">
              {dashboardData.categoriesDistribution.map((cat, idx) => {
                const totalCount = dashboardData.totalTickets || 1;
                const percent = Math.round((cat.count / totalCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">{cat.categoryName}</span>
                      <span className="font-mono text-slate-500">{cat.count} breakdowns ({cat.downtimeHours} hrs)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#1ea751] to-[#0e4d2a] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Breakdown Trend */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Daily Stoppages Trend</span>
              <span className="text-xs text-slate-500 font-normal">Past 30 Days</span>
            </h3>

            <div className="space-y-2">
              {dashboardData.dailyTrend.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-mono text-slate-800 font-medium">{d.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-800 font-bold">{d.breakdownCount} incident(s)</span>
                    <span className="text-red-600 font-mono font-medium">{d.downtimeHours}h downtime</span>
                  </div>
                </div>
              ))}
              {dashboardData.dailyTrend.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">No daily trend records</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MACHINE RANKING REPORT */}
      {activeReportTab === 'machines' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Machine Downtime & Reliability Ranking</h3>
            <span className="text-xs text-slate-500">Sorted by highest downtime hours</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Machine Code</th>
                  <th className="p-3.5">Machine Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center">Incidents</th>
                  <th className="p-3.5 text-right">Downtime</th>
                  <th className="p-3.5 text-right">MTTR</th>
                  <th className="p-3.5 text-right">MTTF</th>
                  <th className="p-3.5 text-right">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machineReports.map((m) => (
                  <tr key={m.machineId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-800">{m.machineCode}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{m.machineName}</td>
                    <td className="p-3.5 text-slate-500">{m.departmentName}</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{m.failureCount}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">{m.downtimeHours} hrs</td>
                    <td className="p-3.5 text-right font-mono text-sky-700">{m.mttrMinutes} min</td>
                    <td className="p-3.5 text-right font-mono text-teal-700">{m.mttfHours ?? m.mtbfHours} hrs</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{m.availabilityPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MECHANIC PERFORMANCE SCORECARD */}
      {activeReportTab === 'mechanics' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Technician Performance & Workload Scorecard</h3>
            <span className="text-xs text-slate-500">Total jobs & average repair labor</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Technician Name</th>
                  <th className="p-3.5">Specialization</th>
                  <th className="p-3.5">Shift</th>
                  <th className="p-3.5 text-center">Active Jobs</th>
                  <th className="p-3.5 text-center">Completed Repairs</th>
                  <th className="p-3.5 text-right">Avg Repair Time (MTTR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mechanicReports.map((mech) => (
                  <tr key={mech.mechanicId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{mech.mechanicName}</td>
                    <td className="p-3.5 text-emerald-800 font-medium">{mech.specialization}</td>
                    <td className="p-3.5 text-slate-500">{mech.shiftName}</td>
                    <td className="p-3.5 text-center font-bold text-amber-600">{mech.activeJobs}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-700">{mech.completedJobs}</td>
                    <td className="p-3.5 text-right font-mono text-slate-800 font-medium">{mech.avgRepairMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SLA BREACH REPORT */}
      {activeReportTab === 'sla' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">SLA Compliance & Target Breach Report</h3>
            <span className="text-xs text-slate-500">Response & Resolution Targets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Ticket ID</th>
                  <th className="p-3.5">Machine</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Resp Target</th>
                  <th className="p-3.5">Actual Resp</th>
                  <th className="p-3.5">Resp Breach</th>
                  <th className="p-3.5">Res Target</th>
                  <th className="p-3.5">Actual Res</th>
                  <th className="p-3.5">Res Breach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slaReports.map((s) => (
                  <tr key={s.ticketId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-emerald-800 font-bold">{s.ticketNumber}</td>
                    <td className="p-3.5 font-medium text-slate-900">{s.machineCode}</td>
                    <td className="p-3.5"><span className="font-bold">{s.priority}</span></td>
                    <td className="p-3.5 font-mono text-slate-500">{s.responseTargetMinutes}m</td>
                    <td className="p-3.5 font-mono text-slate-800">{s.actualResponseMinutes ? `${s.actualResponseMinutes}m` : '-'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isResponseBreached ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                        {s.isResponseBreached ? 'BREACHED' : 'MET'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{s.resolutionTargetMinutes}m</td>
                    <td className="p-3.5 font-mono text-slate-800">{s.actualResolutionMinutes ? `${s.actualResolutionMinutes}m` : '-'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isResolutionBreached ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                        {s.isResolutionBreached ? 'BREACHED' : 'MET'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPEAT BREAKDOWN DETECTOR */}
      {activeReportTab === 'repeat' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Repeat Machine Failures (Rolling 30 Days)</h3>
            <span className="text-xs text-slate-500">Detects chronic component defects</span>
          </div>

          <div className="p-6 space-y-4">
            {repeatReports.map((r, idx) => (
              <div key={idx} className="bg-red-50/70 p-4 rounded-xl border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{r.machineCode} — {r.machineName}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 text-xs font-bold font-mono">
                      {r.failureCountInWindow} Failures in window
                    </span>
                  </div>
                  <div className="text-xs text-amber-800 font-medium mt-1">Category: <strong>{r.categoryName}</strong></div>
                  <div className="text-xs text-slate-500 mt-1">
                    First occurred: {new Date(r.firstOccurrence).toLocaleDateString()} • Latest: {new Date(r.latestOccurrence).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {r.ticketNumbers.map((tNum, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-white border border-red-200 text-red-700 font-semibold shadow-2xs">
                      {tNum}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {repeatReports.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                No chronic repeat breakdowns detected in the rolling 30-day window.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
