import React, { useState } from 'react';
import { MastersAPI } from '../../services/api';
import {
  Users,
  Plus,
  Upload,
  Download,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function SupervisorsMasterTab({
  supervisors,
  departments,
  sections,
  searchTerm,
  onRefresh,
  triggerCSVDownload
}) {
  const [supSubTab, setSupSubTab] = useState('roster'); // 'roster', 'upload'
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);

  // Form States - Supervisor
  const [newSupCode, setNewSupCode] = useState('');
  const [newSupName, setNewSupName] = useState('');
  const [newSupDeptId, setNewSupDeptId] = useState('');
  const [newSupSectionId, setNewSupSectionId] = useState('');
  const [newSupDesignation, setNewSupDesignation] = useState('Shift Production Supervisor');
  const [newSupMobile, setNewSupMobile] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupUsername, setNewSupUsername] = useState('');

  // Upload States
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered Supervisors
  const filteredSupervisors = supervisors.filter(s => {
    const matchesSection = selectedSectionFilter === 'all' || s.sectionId === parseInt(selectedSectionFilter);
    const matchesSearch =
      s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.designation && s.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.sectionName && s.sectionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase()));
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
        departmentId: r.DepartmentId ? parseInt(r.DepartmentId) : 1,
        sectionId: r.SectionId ? parseInt(r.SectionId) : null,
        designation: r.Designation || 'Shift Production Supervisor',
        mobileNumber: r.MobileNumber || '',
        email: r.Email || '',
        username: r.Username || (r.EmployeeCode ? r.EmployeeCode.toLowerCase() : '')
      }));
      await MastersAPI.bulkImportSupervisors(payload);
      setUploadMessage({ type: 'success', text: `Successfully registered ${payload.length} supervisors with credentials!` });
      await onRefresh();
      setParsedRows([]);
      setUploadFileName('');
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message || 'Bulk upload failed. Please verify CSV column headers.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.createSupervisor({
        employeeCode: newSupCode.trim().toUpperCase(),
        employeeName: newSupName.trim(),
        departmentId: newSupDeptId ? parseInt(newSupDeptId) : 1,
        sectionId: newSupSectionId ? parseInt(newSupSectionId) : null,
        designation: newSupDesignation.trim(),
        mobileNumber: newSupMobile.trim(),
        email: newSupEmail.trim(),
        username: newSupUsername.trim().toLowerCase()
      });
      setShowAddSupervisorModal(false);
      setNewSupCode('');
      setNewSupName('');
      setNewSupMobile('');
      setNewSupEmail('');
      setNewSupUsername('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Supervisors Sub-Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupSubTab('roster')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              supSubTab === 'roster'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Supervisors Roster ({supervisors.length})
          </button>

          <button
            onClick={() => setSupSubTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              supSubTab === 'upload'
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
            <option value="all">All Production Sections</option>
            {sections.map(s => (
              <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddSupervisorModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supervisor</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: SUPERVISORS ROSTER */}
      {supSubTab === 'roster' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Production Shift Supervisors & Assigned Bays</h3>
            <span className="text-xs text-slate-500 font-mono">Total {supervisors.length} active supervisors</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Emp Code</th>
                  <th className="p-3.5">Supervisor Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Bay / Section</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Login Username</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupervisors.map((s) => (
                  <tr key={s.employeeId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-900">{s.employeeCode}</td>
                    <td className="p-3.5 font-bold text-slate-900">{s.employeeName}</td>
                    <td className="p-3.5 text-slate-600">{s.departmentName || 'Production'}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {s.sectionName || 'Plant-Wide'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{s.designation}</td>
                    <td className="p-3.5 font-mono text-slate-700">{s.mobileNumber || '-'}</td>
                    <td className="p-3.5 font-mono font-semibold text-slate-800">{s.username || '-'}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSupervisors.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No supervisors found matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: BULK UPLOADATION */}
      {supSubTab === 'upload' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0e4d2a]" />
                Bulk Uploadation — Production Supervisors
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload an Excel-exported CSV file to bulk register shift supervisors, bay mappings, and login credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const sample = "EmployeeCode,EmployeeName,DepartmentId,SectionId,Designation,MobileNumber,Email,Username\nEMP-SUP-04,Nitin Kulkarni,1,2,Sub-Assembly Shift Supervisor,+91 98231 55001,nitin.k@factory.lan,supervisor4\nEMP-SUP-05,Mahesh Shirole,3,4,Lathe Bay Shift Supervisor,+91 98231 55002,mahesh.s@factory.lan,supervisor5";
                triggerCSVDownload('Supervisors_Master_Template.csv', sample);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3 bg-slate-50 hover:bg-emerald-50/40 transition-colors">
            <Users className="w-12 h-12 text-[#0e4d2a] mx-auto" />
            <div>
              <label className="px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Choose Supervisors CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Headers: EmployeeCode, EmployeeName, DepartmentId, SectionId, Designation, MobileNumber, Email, Username
              </p>
              {uploadFileName && (
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-mono font-bold">
                  Selected File: {uploadFileName} ({parsedRows.length} supervisors parsed)
                </div>
              )}
            </div>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  Preview: <span className="font-mono text-emerald-800">{parsedRows.length} Supervisors Ready to Register</span>
                </h4>
                <button
                  disabled={uploading}
                  onClick={handleConfirmUpload}
                  className="px-6 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{uploading ? 'Registering...' : 'Confirm & Save All Supervisors'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Designation</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">Username</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-emerald-900">{row.EmployeeCode || row.employeeCode}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-900">{row.EmployeeName || row.employeeName}</td>
                        <td className="p-2.5 font-sans">{row.Designation || 'Supervisor'}</td>
                        <td className="p-2.5">{row.MobileNumber || '-'}</td>
                        <td className="p-2.5 text-emerald-800">{row.Username || '-'}</td>
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

      {/* MODAL: ADD SUPERVISOR */}
      {showAddSupervisorModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0e4d2a]" />
                Register Production Shift Supervisor
              </h3>
              <button
                onClick={() => setShowAddSupervisorModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupervisor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Employee Code *</label>
                  <input
                    type="text"
                    value={newSupCode}
                    onChange={(e) => setNewSupCode(e.target.value)}
                    placeholder="e.g. EMP-SUP-04"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Login Username *</label>
                  <input
                    type="text"
                    value={newSupUsername}
                    onChange={(e) => setNewSupUsername(e.target.value)}
                    placeholder="supervisor4"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Supervisor Full Name *</label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="e.g. Nitin Kulkarni"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newSupDeptId}
                    onChange={(e) => {
                      setNewSupDeptId(e.target.value);
                      setNewSupSectionId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Choose Dept --</option>
                    {departments.map(d => (
                      <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Section / Bay</label>
                  <select
                    value={newSupSectionId}
                    onChange={(e) => setNewSupSectionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Choose Bay --</option>
                    {sections
                      .filter(s => !newSupDeptId || s.departmentId === parseInt(newSupDeptId))
                      .map(s => (
                        <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newSupMobile}
                    onChange={(e) => setNewSupMobile(e.target.value)}
                    placeholder="+91 98221 00000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company Email</label>
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="user@factory.lan"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Designation Title</label>
                <input
                  type="text"
                  value={newSupDesignation}
                  onChange={(e) => setNewSupDesignation(e.target.value)}
                  placeholder="Shift Production Supervisor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
                Default password will be set to: <strong>Supervisor@123</strong>
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSupervisorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Register Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
