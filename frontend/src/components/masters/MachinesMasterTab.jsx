import React, { useState } from 'react';
import { MastersAPI } from '../../services/api';
import {
  Cpu,
  Plus,
  QrCode,
  Upload,
  Download,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function MachinesMasterTab({
  machines,
  departments,
  sections,
  searchTerm,
  onRefresh,
  triggerCSVDownload
}) {
  const [machineSubTab, setMachineSubTab] = useState('roster'); // 'roster', 'upload'
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);

  // Form States - Machine
  const [newMachineCode, setNewMachineCode] = useState('');
  const [newMachineName, setNewMachineName] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newSectionId, setNewSectionId] = useState('');
  const [newCategory, setNewCategory] = useState('CNC Machine');
  const [newCriticality, setNewCriticality] = useState('MEDIUM');
  const [newLocation, setNewLocation] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');

  // Upload States
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered Machines
  const filteredMachines = machines.filter(m => {
    const matchesSection = selectedSectionFilter === 'all' || m.sectionId === parseInt(selectedSectionFilter);
    const matchesSearch =
      m.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        machineCode: r.MachineCode || r.machineCode || '',
        machineName: r.MachineName || r.machineName || '',
        departmentId: parseInt(r.DepartmentId || r.departmentId || '1') || 1,
        sectionId: r.SectionId ? parseInt(r.SectionId) : null,
        machineCategory: r.Category || r.machineCategory || 'Production Asset',
        criticality: r.Criticality || 'MEDIUM',
        location: r.Location || '',
        manufacturer: r.Manufacturer || '',
        modelNumber: r.ModelNumber || '',
        serialNumber: r.SerialNumber || ''
      }));
      await MastersAPI.bulkImportMachines(payload);
      setUploadMessage({ type: 'success', text: `Successfully imported ${payload.length} machines with QR identifiers!` });
      await onRefresh();
      setParsedRows([]);
      setUploadFileName('');
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message || 'Bulk upload failed. Please verify CSV column headers.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.createMachine({
        machineCode: newMachineCode.trim().toUpperCase(),
        machineName: newMachineName.trim(),
        departmentId: parseInt(newDeptId),
        sectionId: newSectionId ? parseInt(newSectionId) : null,
        machineCategory: newCategory,
        criticality: newCriticality,
        location: newLocation.trim(),
        manufacturer: newManufacturer.trim(),
        modelNumber: newModel.trim(),
        serialNumber: newSerial.trim()
      });
      setShowAddMachineModal(false);
      setNewMachineCode('');
      setNewMachineName('');
      setNewLocation('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Machines Sub-Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMachineSubTab('roster')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              machineSubTab === 'roster'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Factory Assets Roster ({machines.length})
          </button>

          <button
            onClick={() => setMachineSubTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              machineSubTab === 'upload'
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
            onClick={() => setShowAddMachineModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Machine Asset</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: MACHINES ROSTER */}
      {machineSubTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((m) => (
            <div
              key={m.machineId}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{m.machineCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    m.criticality === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                    m.criticality === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {m.criticality}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{m.machineName}</h3>
                <div className="text-xs text-slate-500 mb-3 flex flex-wrap items-center gap-1.5">
                  <span>{m.departmentName}</span>
                  {m.sectionName && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                      {m.sectionName}
                    </span>
                  )}
                  {m.location && <span>• {m.location}</span>}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 mb-4 font-mono">
                  {m.manufacturer && <div>Mfg: <strong className="text-slate-800">{m.manufacturer}</strong></div>}
                  {m.modelNumber && <div>Model: <strong className="text-slate-800">{m.modelNumber}</strong></div>}
                  {m.serialNumber && <div>Serial: <strong className="text-slate-800">{m.serialNumber}</strong></div>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <span className={`text-[11px] font-medium flex items-center gap-1.5 ${
                  m.isUnderBreakdown ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${m.isUnderBreakdown ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                  {m.isUnderBreakdown ? 'Under Breakdown' : 'Operating Normal'}
                </span>

                <a
                  href={`/api/masters/machines/${m.machineId}/qr`}
                  download={`${m.machineCode}_QR.png`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Printable Floor QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#0e4d2a]" />
                  <span>QR Code</span>
                </a>
              </div>
            </div>
          ))}
          {filteredMachines.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300">
              <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No machine assets found matching current criteria</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: BULK UPLOADATION */}
      {machineSubTab === 'upload' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#0e4d2a]" />
                Bulk Uploadation — Machine Assets Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload an Excel-exported CSV file to bulk register machine assets, department/bay assignments, and generate floor QR codes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const sample = "MachineCode,MachineName,DepartmentId,SectionId,Category,Criticality,Location,Manufacturer,ModelNumber,SerialNumber\nMCH-CNC-004,Mazak 5-Axis Variaxis i-700,3,3,CNC Machine,CRITICAL,Bay CNC-4,Mazak,Variaxis-i700,SN-MZ-8812\nMCH-PRS-003,Komatsu 300-Ton Blanking Press,4,5,Stamping Press,HIGH,Press Bay A,Komatsu,OBP-300,SN-KM-3001\nMCH-UTL-002,Atlas Copco GA-90 Screw Compressor,2,7,Air Compressor,HIGH,Utility Room 2,Atlas Copco,GA90-VSD,SN-AC-9011";
                triggerCSVDownload('Machine_Assets_Master_Template.csv', sample);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3 bg-slate-50 hover:bg-emerald-50/40 transition-colors">
            <Cpu className="w-12 h-12 text-[#0e4d2a] mx-auto" />
            <div>
              <label className="px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Choose Machines CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Headers: MachineCode, MachineName, DepartmentId, SectionId, Category, Criticality, Location, Manufacturer, ModelNumber, SerialNumber
              </p>
              {uploadFileName && (
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-mono font-bold">
                  Selected File: {uploadFileName} ({parsedRows.length} machines parsed)
                </div>
              )}
            </div>
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  Preview: <span className="font-mono text-emerald-800">{parsedRows.length} Machine Assets Ready to Register</span>
                </h4>
                <button
                  disabled={uploading}
                  onClick={handleConfirmUpload}
                  className="px-6 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{uploading ? 'Registering...' : 'Confirm & Save All Machines'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Machine Code</th>
                      <th className="p-2.5">Machine Name</th>
                      <th className="p-2.5">Criticality</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Manufacturer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-emerald-900">{row.MachineCode || row.machineCode}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-900">{row.MachineName || row.machineName}</td>
                        <td className="p-2.5 font-bold">{row.Criticality || 'MEDIUM'}</td>
                        <td className="p-2.5 font-sans">{row.Location || 'Floor'}</td>
                        <td className="p-2.5 font-sans">{row.Manufacturer || '-'}</td>
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

      {/* MODAL: ADD MACHINE ASSET */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0e4d2a]" />
                Register New Machine Asset
              </h3>
              <button
                onClick={() => setShowAddMachineModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMachine} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Machine Code *</label>
                  <input
                    type="text"
                    value={newMachineCode}
                    onChange={(e) => setNewMachineCode(e.target.value)}
                    placeholder="e.g. MCH-CNC-003"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Criticality *</label>
                  <select
                    value={newCriticality}
                    onChange={(e) => setNewCriticality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Machine Asset Name *</label>
                <input
                  type="text"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  placeholder="e.g. 5-Axis CNC Milling Center Mazak VTC-800"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => {
                      setNewDeptId(e.target.value);
                      setNewSectionId('');
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  >
                    <option value="">-- Choose Dept --</option>
                    {departments.map(d => (
                      <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Production Section / Bay</label>
                <select
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                >
                  <option value="">-- Choose Section (Optional) --</option>
                  {sections
                    .filter(s => !newDeptId || s.departmentId === parseInt(newDeptId))
                    .map(s => (
                      <option key={s.sectionId} value={s.sectionId}>{s.sectionName} ({s.sectionCode})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Location Bay</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Bay C-3"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    placeholder="Mazak"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="SN-99124"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Save & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
