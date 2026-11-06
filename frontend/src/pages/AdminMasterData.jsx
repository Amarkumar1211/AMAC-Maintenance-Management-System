import React, { useState, useEffect } from 'react';
import { MastersAPI } from '../services/api';
import {
  Layers,
  Plus,
  Search,
  QrCode,
  Download,
  CheckCircle,
  Wrench,
  Factory,
  Cpu,
  Package,
  Settings
} from 'lucide-react';

export default function AdminMasterData() {
  const [activeTab, setActiveTab] = useState('machines'); // 'machines', 'spare_parts', 'departments'
  const [machines, setMachines] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Machine Modal State
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [newMachineCode, setNewMachineCode] = useState('');
  const [newMachineName, setNewMachineName] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newCategory, setNewCategory] = useState('CNC Machine');
  const [newCriticality, setNewCriticality] = useState('MEDIUM');
  const [newLocation, setNewLocation] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mList, pList, dList] = await Promise.all([
        MastersAPI.getMachines(),
        MastersAPI.getSpareParts(),
        MastersAPI.getDepartments()
      ]);
      setMachines(mList);
      setSpareParts(pList);
      setDepartments(dList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    if (!newMachineCode.trim() || !newMachineName.trim() || !newDeptId) {
      alert('Please fill in machine code, name, and department.');
      return;
    }

    try {
      setSubmitting(true);
      await MastersAPI.createMachine({
        machineCode: newMachineCode.trim().toUpperCase(),
        machineName: newMachineName.trim(),
        departmentId: parseInt(newDeptId),
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
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMachines = machines.filter(m =>
    m.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Top Banner (Theme Sample Style) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Asset Directory & Master Data — Factory Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain machine assets (250+ capacity), generate factory floor QR identifiers, and track spare parts inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddMachineModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white font-bold text-xs shadow-md shadow-[#0e4d2a]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Machine Asset</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'machines'
                ? 'bg-[#0e4d2a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Machines Directory ({machines.length})
          </button>

          <button
            onClick={() => setActiveTab('spare_parts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'spare_parts'
                ? 'bg-[#1ea751] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Spare Parts Master ({spareParts.length})
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'departments'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            Departments ({departments.length})
          </button>
        </div>

        {activeTab === 'machines' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, machine, bay..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] focus:ring-1 focus:ring-[#0e4d2a] w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* TAB 1: MACHINES LIST */}
      {activeTab === 'machines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map((m) => (
            <div
              key={m.machineId}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-800">{m.machineCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    m.criticality === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                    m.criticality === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {m.criticality}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{m.machineName}</h3>
                <div className="text-xs text-slate-500 mb-3">{m.departmentName} {m.location && `• ${m.location}`}</div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 mb-4 font-mono">
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Download Printable Floor QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#0e4d2a]" />
                  Download QR
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SPARE PARTS MASTER */}
      {activeTab === 'spare_parts' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Spare Parts Inventory Catalogue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Part Code</th>
                  <th className="p-3.5">Part Name</th>
                  <th className="p-3.5">Specification / Description</th>
                  <th className="p-3.5 text-right">Unit Price</th>
                  <th className="p-3.5 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spareParts.map((p) => (
                  <tr key={p.partId} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-emerald-800">{p.partCode}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{p.partName}</td>
                    <td className="p-3.5 text-slate-500">{p.description}</td>
                    <td className="p-3.5 text-right font-mono text-slate-900 font-bold">₹{p.unitPrice.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{p.stockQuantity} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.departmentId} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <div className="font-mono text-xs text-emerald-800 font-bold mb-1">{d.departmentCode}</div>
              <h4 className="font-bold text-base text-slate-900">{d.departmentName}</h4>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-2 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Active Plant Department
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ADD MACHINE MODAL */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl p-6 shadow-2xl my-8 text-slate-800">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0e4d2a]" />
              Register New Machine Asset
            </h3>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase focus:outline-none focus:border-[#0e4d2a] font-mono"
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
                  placeholder="e.g. 5-Axis CNC Milling Center Haas VF-5"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
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
                    placeholder="Haas"
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
                  className="px-4 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
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
