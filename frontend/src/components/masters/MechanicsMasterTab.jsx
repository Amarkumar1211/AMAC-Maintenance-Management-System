import React, { useState } from 'react';
import { MastersAPI } from '../../services/api';
import {
  Wrench,
  Plus,
  Phone,
  Upload,
  Download,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function MechanicsMasterTab({
  mechanics,
  sections,
  searchTerm,
  onRefresh,
  triggerCSVDownload
}) {
  const [mechSubTab, setMechSubTab] = useState('roster'); // 'roster', 'upload'
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [showAddMechanicModal, setShowAddMechanicModal] = useState(false);

  // Form States - Mechanic
  const [newMechCode, setNewMechCode] = useState('');
  const [newMechName, setNewMechName] = useState('');
  const [newMechSectionId, setNewMechSectionId] = useState('');
  const [newMechSpecialization, setNewMechSpecialization] = useState('Mechanical & Transmission');
  const [newMechMobile, setNewMechMobile] = useState('');

  // Upload States
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered Mechanics
  const filteredMechanics = mechanics.filter(m => {
    const matchesSection = selectedSectionFilter === 'all' || m.sectionId === parseInt(selectedSectionFilter);
    const matchesSearch =
      m.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.specialization && m.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.sectionName && m.sectionName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setUploadMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim());
      if (lines.length < 2) {
        setUploadMessage({ type: 'error', text: 'CSV file must have a header row and at least 1 data row.' });
        setParsedRows([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= headers.length) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          rows.push(rowObj);
        }
      }
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    if (parsedRows.length === 0) return;
    try {
      setUploading(true);
      setUploadMessage(null);
      const payload = parsedRows.map(r => ({
        employeeCode: r.EmployeeCode || r.employeeCode || '',
        employeeName: r.EmployeeName || r.employeeName || '',
        specialization: r.Specialization || r.specialization || 'General Maintenance',
        sectionId: r.SectionId ? parseInt(r.SectionId) : null,
        mobileNumber: r.MobileNumber || r.mobileNumber || ''
      }));
      await MastersAPI.bulkImportMechanics(payload);
      setUploadMessage({ type: 'success', text: `Successfully registered ${payload.length} mechanics in maintenance roster!` });
      await onRefresh();
      setParsedRows([]);
      setUploadFileName('');
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message || 'Bulk upload failed. Please verify CSV column headers.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMechanic = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.createMechanic({
        employeeCode: newMechCode.trim().toUpperCase(),
        employeeName: newMechName.trim(),
        sectionId: newMechSectionId ? parseInt(newMechSectionId) : null,
        specialization: newMechSpecialization,
        mobileNumber: newMechMobile.trim()
      });
      setShowAddMechanicModal(false);
      setNewMechCode('');
      setNewMechName('');
      setNewMechMobile('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mechanics Sub-Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMechSubTab('roster')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mechSubTab === 'roster'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Technicians Roster ({mechanics.length})
          </button>

          <button
            onClick={() => setMechSubTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mechSubTab === 'upload'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Uploadation</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0e4d2a]"
          >
            <option value="all">All Plant Sections</option>
            {sections.map(s => (
              <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddMechanicModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Mechanic</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: MECHANICS ROSTER */}
      {mechSubTab === 'roster' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMechanics.map((m) => (
            <div key={m.mechanicId} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{m.employeeCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.isAvailable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.isAvailable ? 'AVAILABLE' : 'BUSY ON TASK'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{m.employeeName}</h3>
                <p className="text-xs text-emerald-800 font-semibold mb-3">{m.specialization || 'General Maintenance'}</p>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Bay / Section</span>
                    <strong className="text-slate-800">{m.sectionName ? `${m.sectionName} (${m.sectionCode || ''})` : 'Plant-Wide Float'}</strong>
                  </div>
                  {m.mobileNumber && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{m.mobileNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <span className="text-slate-500">Active Work Orders:</span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {m.activeTicketCount} Active
                </span>
              </div>
            </div>
          ))}
          {filteredMechanics.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
              <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No mechanics found matching current criteria</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: BULK UPLOADATION */}
      {mechSubTab === 'upload' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0e4d2a]" />
                Bulk Uploadation — Field Mechanics Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload an Excel-exported CSV file to bulk register mechanics and assign section bay specializations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const sample = "EmployeeCode,EmployeeName,Specialization,SectionId,MobileNumber\nEMP-MCH-11,Sunil Deshmukh,Electrical & Drives,3,+91 98221 44001\nEMP-MCH-12,Gopal Shinde,Hydraulic Systems & Valves,5,+91 98221 44002\nEMP-MCH-13,Vinod Jadhav,CNC Spindle & Bearings,4,+91 98221 44003";
                triggerCSVDownload('Mechanics_Master_Template.csv', sample);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3 bg-slate-50 hover:bg-emerald-50/40 transition-colors">
            <Wrench className="w-12 h-12 text-[#0e4d2a] mx-auto" />
            <div>
              <label className="px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Choose Mechanics CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Headers: EmployeeCode, EmployeeName, Specialization, SectionId, MobileNumber
              </p>
              {uploadFileName && (
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-mono font-bold">
                  Selected File: {uploadFileName} ({parsedRows.length} mechanics parsed)
                </div>
              )}
            </div>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  Preview: <span className="font-mono text-emerald-800">{parsedRows.length} Mechanics Ready to Register</span>
                </h4>
                <button
                  disabled={uploading}
                  onClick={handleConfirmUpload}
                  className="px-6 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{uploading ? 'Registering...' : 'Confirm & Save All Mechanics'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Specialization</th>
                      <th className="p-2.5">Mobile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-emerald-900">{row.EmployeeCode || row.employeeCode}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-900">{row.EmployeeName || row.employeeName}</td>
                        <td className="p-2.5 font-sans">{row.Specialization || 'General'}</td>
                        <td className="p-2.5">{row.MobileNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadMessage && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              uploadMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {uploadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{uploadMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD MECHANIC */}
      {showAddMechanicModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0e4d2a]" />
                Register New Field Mechanic
              </h3>
              <button
                onClick={() => setShowAddMechanicModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMechanic} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Employee Code *</label>
                  <input
                    type="text"
                    value={newMechCode}
                    onChange={(e) => setNewMechCode(e.target.value)}
                    placeholder="e.g. EMP-MCH-11"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newMechMobile}
                    onChange={(e) => setNewMechMobile(e.target.value)}
                    placeholder="+91 98221 00000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mechanic Full Name *</label>
                <input
                  type="text"
                  value={newMechName}
                  onChange={(e) => setNewMechName(e.target.value)}
                  placeholder="e.g. Sunil Deshmukh"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Section / Bay</label>
                  <select
                    value={newMechSectionId}
                    onChange={(e) => setNewMechSectionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Plant-Wide Float --</option>
                    {sections.map(s => (
                      <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Specialization Skill</label>
                  <select
                    value={newMechSpecialization}
                    onChange={(e) => setNewMechSpecialization(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="Mechanical & Transmission">Mechanical & Transmission</option>
                    <option value="Electrical & Drives">Electrical & Drives</option>
                    <option value="Hydraulics & Pneumatics">Hydraulics & Pneumatics</option>
                    <option value="CNC Spindle & Tooling">CNC Spindle & Tooling</option>
                    <option value="Automation & PLC">Automation & PLC</option>
                    <option value="Bearing & Vibration">Bearing & Vibration</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
                Default password will be set to: <strong>Mechanic@123</strong>
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMechanicModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Register Mechanic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
