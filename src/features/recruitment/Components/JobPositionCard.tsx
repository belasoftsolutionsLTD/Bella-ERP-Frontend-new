'use client';
import { useState } from 'react';
import { Pencil, Trash2, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import type { JobPosition } from '../Hooks/useJobPositions';

const STATUS: Record<string, string> = {
  open:   'bg-success/10 text-success',
  filled: 'bg-primary/10 text-primary',
  frozen: 'bg-gray-100 text-gray-500',
};

interface Props {
  position: JobPosition;
  onEdit?: (position: JobPosition) => void;
  onDelete?: (position: JobPosition) => void;
}

export function JobPositionCard({ position, onEdit, onDelete }: Props) {
  const [downloading, setDownloading] = useState(false);

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
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-sm">{position.jobTitle}</h3>
        <div className="flex items-center gap-1.5">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS[position.status] ?? 'bg-gray-100')}>
            {position.status}
          </span>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            title="Download job post as PDF"
            className="p-1 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
          </button>
          {onEdit && (
            <button onClick={() => onEdit(position)} title="Edit"
              className="p-1 rounded-lg text-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(position)} title="Delete"
              className="p-1 rounded-lg text-foreground/30 hover:text-danger hover:bg-danger/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-foreground/60 mb-3">{position.department}</p>
      <div className="flex gap-4 text-xs text-foreground/50">
        <span>Openings: <strong>{position.numberOfOpenings}</strong></span>
        <span>Filled: <strong>{position.filledCount}</strong></span>
      </div>
      {position.salaryBandMin && (
        <p className="text-xs text-foreground/50 mt-1">
          KES {position.salaryBandMin.toLocaleString()} – {position.salaryBandMax?.toLocaleString()}
        </p>
      )}
    </div>
  );
}
