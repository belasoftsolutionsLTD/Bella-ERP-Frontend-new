'use client';
import { ApplicantCard } from './ApplicantCard';
import type { Applicant } from '../Hooks/useRecruitment';

const COLORS: Record<string, string> = {
  applied: 'border-t-gray-400',
  shortlisted: 'border-t-primary',
  interview_scheduled: 'border-t-accent',
  offer_sent: 'border-t-warning',
  hired: 'border-t-success',
  rejected: 'border-t-danger',
};

interface Props { stage: string; label: string; applicants: Applicant[]; onSelect: (a: Applicant) => void }

export function KanbanColumn({ stage, label, applicants, onSelect }: Props) {
  return (
    <div className={`flex-1 min-w-[200px] rounded-xl border-t-4 bg-white shadow-sm ${COLORS[stage] ?? ''}`}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{applicants.length}</span>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px]">
        {applicants.map((a) => <ApplicantCard key={a._id} applicant={a} onClick={() => onSelect(a)} />)}
      </div>
    </div>
  );
}
