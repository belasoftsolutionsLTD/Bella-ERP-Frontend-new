'use client';

import { useState } from 'react';
import { Pencil, Trash2, Download, Loader2, MapPin, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import type { JobPosition } from '../Hooks/useJobPositions';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  open:   { label: 'Open',   cls: 'bg-green-50 text-green-700 border-green-200'   },
  filled: { label: 'Filled', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200'},
  frozen: { label: 'Paused', cls: 'bg-amber-50 text-amber-700 border-amber-200'   },
  closed: { label: 'Closed', cls: 'bg-red-50 text-red-700 border-red-200'         },
};

interface Props {
  position: JobPosition;
  onEdit?: (position: JobPosition) => void;
  onDelete?: (position: JobPosition) => void;
}

export function JobPositionCard({ position, onEdit, onDelete }: Props) {
  const [downloading, setDownloading] = useState(false);
  const statusCfg = STATUS_CFG[position.status] ?? { label: position.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  const remaining = position.numberOfOpenings - (position.filledCount ?? 0);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const url = `${API_BASE_URL}/public/positions/${position._id}/pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${position.jobTitle.replace(/\s+/g, '_')}_Job_Post.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-3">

      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-900 text-base leading-tight">{position.jobTitle}</h3>
        <span className={cn('shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusCfg.cls)}>
          {statusCfg.label}
        </span>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
          <Briefcase className="h-3 w-3" />
          {position.department}
        </span>
        {position.jobCategory && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            {position.jobCategory}
          </span>
        )}
      </div>

      {/* Description */}
      {position.jobDescription && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{position.jobDescription}</p>
      )}

      {/* Salary */}
      {position.salaryBandMin != null && (
        <p className="text-xs text-slate-500">
          KES {position.salaryBandMin.toLocaleString()}
          {position.salaryBandMax ? ` – ${position.salaryBandMax.toLocaleString()}` : '+'}
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span><strong className="text-slate-900">{position.numberOfOpenings}</strong> openings</span>
        </div>
        <div className="text-xs text-slate-600">
          <strong className="text-slate-900">{position.filledCount ?? 0}</strong> filled
        </div>
        {remaining > 0 && (
          <div className="text-xs text-emerald-700 font-medium ml-auto">
            {remaining} remaining
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-2 mt-auto">
        <button
          onClick={downloadPdf}
          disabled={downloading}
          title="Download job post as PDF"
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        </button>
        {onEdit && (
          <button onClick={() => onEdit(position)} title="Edit"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(position)} title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
