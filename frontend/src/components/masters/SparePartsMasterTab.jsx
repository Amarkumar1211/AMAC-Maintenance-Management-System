import React, { useState } from 'react';
import { MastersAPI } from '../../services/api';
import {
  Package,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function SparePartsMasterTab({
  spareParts,
  transactions,
  machines,
  mechanics,
  searchTerm,
  onRefresh,
  triggerCSVDownload
}) {
  const [spareSubTab, setSpareSubTab] = useState('catalog'); // 'catalog', 'inward', 'outward', 'upload'
  const [showAddSpareModal, setShowAddSpareModal] = useState(false);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);

  // Form States - Spare Part
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartUnit, setNewPartUnit] = useState('NOS');
  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartStock, setNewPartStock] = useState(0);

  // Form States - Inward
  const [inwardPartId, setInwardPartId] = useState('');
  const [inwardQty, setInwardQty] = useState(1);
  const [inwardPrice, setInwardPrice] = useState(0);
  const [inwardRefNo, setInwardRefNo] = useState('');
  const [inwardSource, setInwardSource] = useState('');
  const [inwardRemarks, setInwardRemarks] = useState('');

  // Form States - Outward
  const [outwardPartId, setOutwardPartId] = useState('');
  const [outwardQty, setOutwardQty] = useState(1);
  const [outwardMachineId, setOutwardMachineId] = useState('');
  const [outwardMechanicId, setOutwardMechanicId] = useState('');
  const [outwardRefNo, setOutwardRefNo] = useState('');
  const [outwardRemarks, setOutwardRemarks] = useState('');

  // Upload States
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered Spares
  const filteredSpares = spareParts.filter(p =>
    p.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtered Transactions
  const inwardTransactions = transactions.filter(t => t.transactionType === 'INWARD');
  const outwardTransactions = transactions.filter(t => t.transactionType === 'OUTWARD');

  // KPI Calculations
  const totalStockValue = spareParts.reduce((acc, p) => acc + (p.stockQuantity * p.unitPrice), 0);
  const lowStockCount = spareParts.filter(p => p.stockQuantity < 10).length;
  const outOfStockCount = spareParts.filter(p => p.stockQuantity <= 0).length;

  // Handle CSV upload
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
        partCode: r.PartCode || r.partCode || r.PART_CODE || '',
        partName: r.PartName || r.partName || r.PART_NAME || '',
        unit: r.Unit || r.unit || 'NOS',
        unitPrice: parseFloat(r.UnitPrice || r.unitPrice || '0') || 0,
        stockQuantity: parseFloat(r.StockQuantity || r.stockQuantity || '0') || 0,
        description: r.Description || r.description || ''
      }));
      await MastersAPI.bulkImportSpareParts(payload);
      setUploadMessage({ type: 'success', text: `Successfully imported ${payload.length} spare parts into inventory master!` });
      await onRefresh();
      setParsedRows([]);
      setUploadFileName('');
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message || 'Bulk upload failed. Please verify CSV column headers.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSpare = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.createSparePart({
        partCode: newPartCode.trim().toUpperCase(),
        partName: newPartName.trim(),
        unit: newPartUnit.trim().toUpperCase(),
        description: newPartDesc.trim(),
        unitPrice: parseFloat(newPartPrice) || 0,
        stockQuantity: parseFloat(newPartStock) || 0
      });
      setShowAddSpareModal(false);
      setNewPartCode('');
      setNewPartName('');
      setNewPartDesc('');
      setNewPartPrice(0);
      setNewPartStock(0);
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.addSparePartTransaction({
        partId: parseInt(inwardPartId),
        transactionType: 'INWARD',
        quantity: parseFloat(inwardQty),
        unitPrice: parseFloat(inwardPrice) || 0,
        referenceNo: inwardRefNo.trim(),
        supplierOrSource: inwardSource.trim(),
        remarks: inwardRemarks.trim()
      });
      setShowInwardModal(false);
      setInwardPartId('');
      setInwardQty(1);
      setInwardPrice(0);
      setInwardRefNo('');
      setInwardSource('');
      setInwardRemarks('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutwardSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await MastersAPI.addSparePartTransaction({
        partId: parseInt(outwardPartId),
        transactionType: 'OUTWARD',
        quantity: parseFloat(outwardQty),
        machineId: outwardMachineId ? parseInt(outwardMachineId) : null,
        mechanicId: outwardMechanicId ? parseInt(outwardMechanicId) : null,
        referenceNo: outwardRefNo.trim(),
        supplierOrSource: 'Shop Floor Issue',
        remarks: outwardRemarks.trim()
      });
      setShowOutwardModal(false);
      setOutwardPartId('');
      setOutwardQty(1);
      setOutwardMachineId('');
      setOutwardMechanicId('');
      setOutwardRefNo('');
      setOutwardRemarks('');
      await onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Spares Sub-Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSpareSubTab('catalog')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              spareSubTab === 'catalog'
                ? 'bg-[#1ea751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Catalog Roster ({spareParts.length})
          </button>

          <button
            onClick={() => setSpareSubTab('inward')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              spareSubTab === 'inward'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inward Receipts ({inwardTransactions.length})</span>
          </button>

          <button
            onClick={() => setSpareSubTab('outward')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              spareSubTab === 'outward'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
            <span>Outward Issues ({outwardTransactions.length})</span>
          </button>

          <button
            onClick={() => setSpareSubTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              spareSubTab === 'upload'
                ? 'bg-[#0e4d2a] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Uploadation</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInwardModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Inward Stock</span>
          </button>

          <button
            onClick={() => setShowOutwardModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
            <span>+ Outward Issue</span>
          </button>

          <button
            onClick={() => setShowAddSpareModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Spare Part</span>
          </button>
        </div>
      </div>

      {/* Inventory KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Catalog Items</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{spareParts.length} SKUs</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Production Maintenance</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valuation (Estimated)</span>
          <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <span className="text-[10px] text-slate-500">Live inventory valuation</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Low Stock Alert (&lt;10)</span>
          <div className="text-xl font-black text-amber-800 font-mono mt-0.5">{lowStockCount} Parts</div>
          <span className="text-[10px] text-amber-700 font-semibold">Requires re-order purchase</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Out of Stock</span>
          <div className="text-xl font-black text-red-700 font-mono mt-0.5">{outOfStockCount} Parts</div>
          <span className="text-[10px] text-red-600 font-semibold">Critical stock-out risk</span>
        </div>
      </div>

      {/* SUB-VIEW 1: MASTER CATALOG */}
      {spareSubTab === 'catalog' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Current Spare Parts Master Catalog</h3>
            <span className="text-xs text-slate-500 font-mono">Showing {filteredSpares.length} of {spareParts.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Part Code</th>
                  <th className="p-3.5">Part Name & Specification</th>
                  <th className="p-3.5">UOM</th>
                  <th className="p-3.5 text-right">Unit Price</th>
                  <th className="p-3.5 text-right">Stock Quantity</th>
                  <th className="p-3.5 text-center">Stock Health</th>
                  <th className="p-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSpares.map((p) => {
                  const isLow = p.stockQuantity < 10 && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;
                  return (
                    <tr key={p.partId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-900">{p.partCode}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{p.partName}</span>
                        <span className="text-[10px] text-slate-500">{p.description || 'Standard OEM replacement part'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{p.unit}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">₹{p.unitPrice.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900">
                        {p.stockQuantity} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            OPTIMAL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInwardPartId(p.partId.toString());
                              setInwardPrice(p.unitPrice);
                              setShowInwardModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 cursor-pointer"
                            title="Add inward stock receipt"
                          >
                            + Inward
                          </button>
                          <button
                            onClick={() => {
                              setOutwardPartId(p.partId.toString());
                              setShowOutwardModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 cursor-pointer"
                            title="Issue part outward"
                          >
                            - Issue
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: INWARD LOG */}
      {spareSubTab === 'inward' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                Inward Goods Receipt Log (GRN & Deliveries)
              </h3>
              <p className="text-[11px] text-slate-500">History of spare parts received into factory central maintenance stores.</p>
            </div>
            <button
              onClick={() => setShowInwardModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Inward Receipt</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/70 text-emerald-950 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Ref / GRN No</th>
                  <th className="p-3.5">Part Code & Name</th>
                  <th className="p-3.5 text-right">Qty Received</th>
                  <th className="p-3.5 text-right">Unit Price</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5">Vendor / Source</th>
                  <th className="p-3.5">Remarks / User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inwardTransactions.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString()} {new Date(tx.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-900">{tx.referenceNo || 'GRN-AUTO'}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{tx.partCode}</span>
                      <span className="text-[10px] text-slate-500">{tx.partName}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700">
                      +{tx.quantity} {tx.unit}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700">₹{tx.unitPrice.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">₹{tx.totalAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-700">{tx.supplierOrSource || 'Central Stores'}</td>
                    <td className="p-3.5 text-slate-500">
                      <div>{tx.remarks || 'Standard receipt'}</div>
                      <div className="text-[9px] font-mono text-slate-400">By: {tx.createdBy || 'Store Incharge'}</div>
                    </td>
                  </tr>
                ))}
                {inwardTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No inward receipts recorded yet. Click "+ Log New Inward Receipt" to record newly arrived parts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: OUTWARD LOG */}
      {spareSubTab === 'outward' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-700" />
                Outward Parts Issue Log (Maintenance Work Orders)
              </h3>
              <p className="text-[11px] text-slate-500">History of spare parts issued to machine breakdowns, trial replacements, and work orders.</p>
            </div>
            <button
              onClick={() => setShowOutwardModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Outward Issue</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-50/70 text-amber-950 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Ticket / Work Order</th>
                  <th className="p-3.5">Target Machine</th>
                  <th className="p-3.5">Part Code & Name</th>
                  <th className="p-3.5 text-right">Qty Issued</th>
                  <th className="p-3.5">Issued To Mechanic</th>
                  <th className="p-3.5">Remarks / Fault Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outwardTransactions.map((tx) => (
                  <tr key={tx.transactionId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString()} {new Date(tx.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-900">
                      {tx.referenceNo || 'SHOP-ISSUE'}
                    </td>
                    <td className="p-3.5">
                      {tx.machineCode ? (
                        <div>
                          <strong className="font-mono text-slate-900 block">{tx.machineCode}</strong>
                          <span className="text-[10px] text-slate-500">{tx.machineName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">Floor Spare</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{tx.partCode}</span>
                      <span className="text-[10px] text-slate-500">{tx.partName}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-amber-700">
                      -{tx.quantity} {tx.unit}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{tx.mechanicName || 'Field Technician'}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{tx.remarks || 'Breakdown replacement'}</div>
                    </td>
                  </tr>
                ))}
                {outwardTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No outward issues recorded yet. When mechanics consume parts or parts are issued to shop floor, they will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: BULK UPLOADATION */}
      {spareSubTab === 'upload' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0e4d2a]" />
                Bulk Uploadation — Spare Parts Inventory Master
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload an Excel-exported CSV file to bulk create or update spare parts and sync live quantities.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const sample = "PartCode,PartName,Unit,UnitPrice,StockQuantity,Description\nPART-BRG-6205,Deep Groove Ball Bearing 6205-2RS,NOS,450.00,25,SKF Deep Groove Ball Bearing for Spindles\nPART-VBLT-B52,Industrial V-Belt B-52,NOS,380.00,15,High-Torque Fenner Power Transmission Belt\nPART-HYD-SEAL,Hydraulic Piston Seal 80mm,SET,850.00,10,Parker Double Acting Hydraulic Cylinder Seal Kit";
                triggerCSVDownload('Spare_Parts_Master_Template.csv', sample);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3 bg-slate-50 hover:bg-emerald-50/40 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-[#0e4d2a] mx-auto" />
            <div>
              <label className="px-5 py-2.5 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Choose CSV File to Upload</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Supported: Standard comma-separated values (.csv) with headers: PartCode, PartName, Unit, UnitPrice, StockQuantity, Description
              </p>
              {uploadFileName && (
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-mono font-bold">
                  Selected File: {uploadFileName} ({parsedRows.length} rows parsed)
                </div>
              )}
            </div>
          </div>

          {/* Preview & Confirmation Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">
                  File Preview: <span className="font-mono text-emerald-800">{parsedRows.length} Spare Part Records Ready to Import</span>
                </h4>
                <button
                  disabled={uploading}
                  onClick={handleConfirmUpload}
                  className="px-6 py-2.5 rounded-xl bg-[#1ea751] hover:bg-[#168a42] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{uploading ? 'Importing Data...' : 'Confirm & Save All to Spare Master'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Part Code</th>
                      <th className="p-2.5">Part Name</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Stock Qty</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-emerald-900">{row.PartCode || row.partCode}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-900">{row.PartName || row.partName}</td>
                        <td className="p-2.5">{row.Unit || row.unit || 'NOS'}</td>
                        <td className="p-2.5 text-right font-sans">₹{row.UnitPrice || row.unitPrice || '0'}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">{row.StockQuantity || row.stockQuantity || '0'}</td>
                        <td className="p-2.5 font-sans text-slate-500 truncate max-w-xs">{row.Description || row.description}</td>
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

      {/* MODAL: ADD NEW SPARE PART */}
      {showAddSpareModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0e4d2a]" />
                Add New Spare Part to Master
              </h3>
              <button
                onClick={() => setShowAddSpareModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpare} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Part Code *</label>
                  <input
                    type="text"
                    value={newPartCode}
                    onChange={(e) => setNewPartCode(e.target.value)}
                    placeholder="e.g. PART-BRG-6205"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0e4d2a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">UOM Unit *</label>
                  <select
                    value={newPartUnit}
                    onChange={(e) => setNewPartUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="NOS">NOS</option>
                    <option value="SET">SET</option>
                    <option value="LITERS">LITERS</option>
                    <option value="METERS">METERS</option>
                    <option value="KGS">KGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Part Name *</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g. Deep Groove Ball Bearing 6205-2RS"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Opening Stock</label>
                  <input
                    type="number"
                    step="1"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Specification / OEM Notes</label>
                <textarea
                  value={newPartDesc}
                  onChange={(e) => setNewPartDesc(e.target.value)}
                  placeholder="e.g. SKF Bearing, ID 25mm, OD 52mm, Width 15mm with rubber seals"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0e4d2a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSpareModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0e4d2a] hover:bg-[#07351b] text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Create Spare Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INWARD STOCK RECEIPT */}
      {showInwardModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                Log Inward Goods Receipt (GRN)
              </h3>
              <button
                onClick={() => setShowInwardModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Spare Part Item *</label>
                <select
                  value={inwardPartId}
                  onChange={(e) => {
                    setInwardPartId(e.target.value);
                    const selected = spareParts.find(p => p.partId === parseInt(e.target.value));
                    if (selected) setInwardPrice(selected.unitPrice);
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                >
                  <option value="">-- Choose Spare Part --</option>
                  {spareParts.map(p => (
                    <option key={p.partId} value={p.partId}>
                      {p.partCode} — {p.partName} (Current: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inwardPrice}
                    onChange={(e) => setInwardPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">PO / GRN Docket No</label>
                  <input
                    type="text"
                    value={inwardRefNo}
                    onChange={(e) => setInwardRefNo(e.target.value)}
                    placeholder="e.g. GRN-U5-4012"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    value={inwardSource}
                    onChange={(e) => setInwardSource(e.target.value)}
                    placeholder="e.g. SKF India Ltd"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Inward Notes & Inspection Remarks</label>
                <input
                  type="text"
                  value={inwardRemarks}
                  onChange={(e) => setInwardRemarks(e.target.value)}
                  placeholder="e.g. Quality verified, stored in Rack B-4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !inwardPartId}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Confirm Inward Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OUTWARD PART ISSUE */}
      {showOutwardModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-700" />
                Log Outward Issue (Maintenance Requisition)
              </h3>
              <button
                onClick={() => setShowOutwardModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOutwardSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Spare Part Item *</label>
                <select
                  value={outwardPartId}
                  onChange={(e) => setOutwardPartId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-700"
                >
                  <option value="">-- Choose Spare Part --</option>
                  {spareParts.map(p => (
                    <option key={p.partId} value={p.partId}>
                      {p.partCode} — {p.partName} (Available Stock: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity to Issue *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={outwardQty}
                    onChange={(e) => setOutwardQty(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Machine</label>
                  <select
                    value={outwardMachineId}
                    onChange={(e) => setOutwardMachineId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Select Machine --</option>
                    {machines.map(m => (
                      <option key={m.machineId} value={m.machineId}>
                        {m.machineCode} — {m.machineName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Issued to Mechanic</label>
                  <select
                    value={outwardMechanicId}
                    onChange={(e) => setOutwardMechanicId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Select Technician --</option>
                    {mechanics.map(m => (
                      <option key={m.mechanicId} value={m.mechanicId}>
                        {m.employeeName} ({m.specialization || 'Fitter'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ticket / Work Order Ref</label>
                  <input
                    type="text"
                    value={outwardRefNo}
                    onChange={(e) => setOutwardRefNo(e.target.value)}
                    placeholder="e.g. BD-2026-00004"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fault Reason / Issue Purpose</label>
                <input
                  type="text"
                  value={outwardRemarks}
                  onChange={(e) => setOutwardRemarks(e.target.value)}
                  placeholder="e.g. Emergency replacement for spindle drive overheating"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOutwardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !outwardPartId}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md disabled:opacity-40"
                >
                  Confirm Outward Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
