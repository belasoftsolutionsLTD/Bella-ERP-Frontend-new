'use client';

import { cn } from '@/lib/utils';
import { ApplicantCard } from './ApplicantCard';
import { KANBAN_COLUMN_COLORS, STAGE_CONFIG, stageCfg } from '../constants';
import type { Applicant } from '../Hooks/useRecruitment';

interface Props {
  stage: string;
  label: string;
  applicants: Applicant[];
  onSelect: (a: Applicant) => void;
}

export function KanbanColumn({ stage, label, applicants, onSelect }: Props) {
  const col = KANBAN_COLUMN_COLORS[stage] ?? { topBorder: 'border-t-gray-300', badgeCls: 'bg-gray-100 text-gray-600' };

  return (
    <div className={cn('flex flex-col w-[260px] min-w-[260px] rounded-xl border border-slate-700 bg-[#1e293b] shadow-sm border-t-[3px]', col.topBorder)}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</h3>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', col.badgeCls)}>
          {applicants.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {applicants.map(a => (
          <ApplicantCard key={a._id} applicant={a} onClick={() => onSelect(a)} />
        ))}
        {applicants.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400">No candidates</div>
        )}
      </div>
    </div>
  );
}
