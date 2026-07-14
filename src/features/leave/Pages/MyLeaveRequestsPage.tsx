'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Loader2, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { useMyLeaveRequests } from '../Hooks/useMyLeave';
import type { LeaveRequestStatus } from '../types';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const LEAVE_STATUS_MAP: Record<string, Status> = {
  draft: 'draft', pending: 'pending', approved: 'approved', rejected: 'rejected',
  cancelled: 'cancelled', disputed: 'pending',
};

const FILTERS: { label: string; value: LeaveRequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Disputed', value: 'disputed' },
];

export default function MyLeaveRequestsPage({ locale }: { locale: string }) {
  const [filter, setFilter] = useState<LeaveRequestStatus | 'all'>('all');
  const { requests, loading } = useMyLeaveRequests(filter === 'all' ? undefined : filter);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">My Leave Requests</h1>
          <p className="text-sm text-brand-text-secondary">Track the status of everything you've submitted</p>
        </div>
        <Link href={`/${locale}/my/leave/apply`} className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Apply for Leave
        </Link>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              filter === f.value ? 'bg-primary text-white' : 'bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text')}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-brand-text-secondary text-center py-16">No leave requests found.</p>
        ) : (
          requests.map(r => (
            <Link key={r._id} href={`/${locale}/my/leave/requests/${r._id}`}
              className="flex items-center justify-between px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.leaveType?.color }} />
                  <p className="text-sm font-medium text-slate-800">{r.leaveType?.name ?? 'Leave'}</p>
                </div>
                <p className="text-xs text-brand-text-secondary mt-0.5">{fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.totalDays}d</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={LEAVE_STATUS_MAP[r.status] ?? 'inactive'} label={r.status} className="text-xs px-2.5 py-1" />
                <ChevronRight className="h-4 w-4 text-brand-text-secondary" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
