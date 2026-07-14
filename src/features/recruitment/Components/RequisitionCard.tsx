'use client';

import Link from 'next/link';
import { MapPin, Users, Clock } from 'lucide-react';
import type { JobRequisition } from '../types';
import { REQUISITION_STATUS_MAP, REQUISITION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS } from '../constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function RequisitionCard({ requisition, locale }: { requisition: JobRequisition; locale: string }) {
  const daysOpen = Math.floor((Date.now() - new Date(requisition.createdAt).getTime()) / 86400000);

  return (
    <Link
      href={`/${locale}/recruitment/requisitions/${requisition._id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-primary/40 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{requisition.title}</h3>
          <p className="text-sm text-slate-500">{requisition.department}</p>
        </div>
        <StatusBadge status={REQUISITION_STATUS_MAP[requisition.status]} label={REQUISITION_STATUS_LABELS[requisition.status]} className="shrink-0 py-1" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {requisition.location}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {requisition.headcount} opening{requisition.headcount !== 1 ? 's' : ''}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {daysOpen}d open</span>
        <span>{EMPLOYMENT_TYPE_LABELS[requisition.employmentType]}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{requisition.applicantCount ?? 0} applicant{(requisition.applicantCount ?? 0) !== 1 ? 's' : ''}</span>
        {requisition.status === 'pendingApproval' && (
          <span className="text-xs font-medium text-amber-600">Needs approval</span>
        )}
      </div>
    </Link>
  );
}
