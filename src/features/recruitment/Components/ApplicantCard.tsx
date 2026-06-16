'use client';
import { User } from 'lucide-react';
import type { Applicant } from '../Hooks/useRecruitment';

export function ApplicantCard({ applicant, onClick }: { applicant: Applicant; onClick: () => void }) {
  return (
    <div onClick={onClick} className="p-3 border rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm cursor-pointer transition-all">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{applicant.fullName}</p>
          <p className="text-xs text-foreground/50">{applicant.email}</p>
        </div>
      </div>
      <p className="text-xs text-foreground/40 mt-1">{new Date(applicant.createdAt).toLocaleDateString('en-KE')}</p>
    </div>
  );
}
