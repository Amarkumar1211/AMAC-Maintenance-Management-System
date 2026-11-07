import React from 'react';
import { Factory } from 'lucide-react';

export default function DepartmentsMasterTab({
  departments,
  sections
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((d) => (
        <div key={d.departmentId} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <div className="font-mono text-xs text-emerald-900 font-bold mb-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
            {d.departmentCode}
          </div>
          <h4 className="font-bold text-base text-slate-900 mt-2">{d.departmentName}</h4>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 block mb-1">Production Sections:</span>
            <div className="flex flex-wrap gap-1">
              {sections.filter(s => s.departmentId === d.departmentId).map(s => (
                <span key={s.sectionId} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono">
                  {s.sectionName}
                </span>
              ))}
              {sections.filter(s => s.departmentId === d.departmentId).length === 0 && (
                <span className="text-slate-400 italic text-[11px]">No dedicated sub-sections</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
