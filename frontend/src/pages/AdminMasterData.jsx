import React, { useState, useEffect } from 'react';
import { MastersAPI } from '../services/api';
import {
  Layers,
  Search,
  Cpu,
  Package,
  Wrench,
  Users,
  Factory,
  RotateCcw
} from 'lucide-react';

import SparePartsMasterTab from '../components/masters/SparePartsMasterTab';
import MachinesMasterTab from '../components/masters/MachinesMasterTab';
import MechanicsMasterTab from '../components/masters/MechanicsMasterTab';
import SupervisorsMasterTab from '../components/masters/SupervisorsMasterTab';
import DepartmentsMasterTab from '../components/masters/DepartmentsMasterTab';

export default function AdminMasterData() {
  // Main Top Sections: 'spares', 'machines', 'mechanics', 'supervisors', 'departments'
  const [activeTab, setActiveTab] = useState('spares');

  // Master Data Collections
  const [machines, setMachines] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [mList, pList, txList, dList, sList, mechList, supList, shList] = await Promise.all([
        MastersAPI.getMachines(),
        MastersAPI.getSpareParts(),
        MastersAPI.getSparePartTransactions(),
        MastersAPI.getDepartments(),
        MastersAPI.getSections(),
        MastersAPI.getMechanics(),
        MastersAPI.getSupervisors(),
        MastersAPI.getShifts()
      ]);
      setMachines(mList || []);
      setSpareParts(pList || []);
      setTransactions(txList || []);
      setDepartments(dList || []);
      setSections(sList || []);
      setMechanics(mechList || []);
      setSupervisors(supList || []);
      setShifts(shList || []);
    } catch (err) {
      console.error('Error loading master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CSV Downloader Helper
  const triggerCSVDownload = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">

      {/* TOP BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e4d2a] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Factory Master Data & Ledger Management — Unit 5 (U5)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Dedicated master rosters with full Inward/Outward stock movements, QR codes, and 1-click Excel/CSV bulk uploadation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh master data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* PRIMARY MASTER NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('spares'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'spares'
                ? 'bg-[#0e4d2a] text-white shadow-md shadow-[#0e4d2a]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Spare Parts & Ledger ({spareParts.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('machines'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'machines'
                ? 'bg-[#0e4d2a] text-white shadow-md shadow-[#0e4d2a]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Machines Directory ({machines.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('mechanics'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'mechanics'
                ? 'bg-[#0e4d2a] text-white shadow-md shadow-[#0e4d2a]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Mechanics Master ({mechanics.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('supervisors'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'supervisors'
                ? 'bg-[#0e4d2a] text-white shadow-md shadow-[#0e4d2a]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Supervisors Master ({supervisors.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('departments'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Departments ({departments.length})</span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0e4d2a] focus:bg-white"
          />
        </div>
      </div>

      {/* 1. DEDICATED SPARE PARTS & STOCK LEDGER */}
      {activeTab === 'spares' && (
        <SparePartsMasterTab
          spareParts={spareParts}
          transactions={transactions}
          machines={machines}
          mechanics={mechanics}
          searchTerm={searchTerm}
          onRefresh={loadData}
          triggerCSVDownload={triggerCSVDownload}
        />
      )}

      {/* 2. DEDICATED MACHINES DIRECTORY */}
      {activeTab === 'machines' && (
        <MachinesMasterTab
          machines={machines}
          departments={departments}
          sections={sections}
          searchTerm={searchTerm}
          onRefresh={loadData}
          triggerCSVDownload={triggerCSVDownload}
        />
      )}

      {/* 3. DEDICATED MECHANICS MASTER */}
      {activeTab === 'mechanics' && (
        <MechanicsMasterTab
          mechanics={mechanics}
          sections={sections}
          searchTerm={searchTerm}
          onRefresh={loadData}
          triggerCSVDownload={triggerCSVDownload}
        />
      )}

      {/* 4. DEDICATED SUPERVISORS MASTER */}
      {activeTab === 'supervisors' && (
        <SupervisorsMasterTab
          supervisors={supervisors}
          departments={departments}
          sections={sections}
          searchTerm={searchTerm}
          onRefresh={loadData}
          triggerCSVDownload={triggerCSVDownload}
        />
      )}

      {/* 5. DEPARTMENTS & SECTIONS */}
      {activeTab === 'departments' && (
        <DepartmentsMasterTab
          departments={departments}
          sections={sections}
        />
      )}

    </div>
  );
}
