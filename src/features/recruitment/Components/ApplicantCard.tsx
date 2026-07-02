'use client';

import { cn } from '@/lib/utils';
import { SOURCE_CONFIG } from '../constants';
import type { Applicant } from '../Hooks/useRecruitment';

export function ApplicantCard({ applicant, onClick }: { applicant: Applicant; onClick: () => void }) {
  const srcCfg = SOURCE_CONFIG[applicant.source ?? ''] ?? SOURCE_CONFIG.other;
  const appliedDate = applicant.appliedAt ? new Date(applicant.appliedAt) : new Date(applicant.createdAt);
  const daysAgo = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-md cursor-pointer transition-all hover:border-indigo-200 group"
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-sm font-semibold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">{applicant.fullName}</p>
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 ml-2 tabular-nums">
          {daysAgo === 0 ? 'today' : `${daysAgo}d`}
        </span>
      </div>
      {applicant.positionTitle && (
        <p className="text-xs text-slate-500 truncate mb-2">{applicant.positionTitle}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400">
          {appliedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', srcCfg.cls)}>
          {srcCfg.label}
        </span>
      </div>
    </div>
  );
}
