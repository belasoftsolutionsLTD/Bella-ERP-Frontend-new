'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Search, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { useLeaveRequests } from '../Hooks/useLeaveRequests';
import { useLeaveTypes } from '../Hooks/useLeaveTypes';

const LEAVE_STATUS_MAP: Record<string, Status> = {
  draft: 'draft', pending: 'pending', approved: 'approved', rejected: 'rejected',
  cancelled: 'cancelled', disputed: 'pending',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function LeaveRequestsPage() {
  const locale = useLocale();
  const [status, setStatus] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [search, setSearch] = useState('');
  const { requests, loading } = useLeaveRequests({ status, leaveTypeId, search });
  const { leaveTypes } = useLeaveTypes();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Leave
        </Link>
        <h1 className="text-xl font-bold text-brand-text">All Leave Requests</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">Filter and review every leave request</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name…"
            className="w-full h-9 pl-9 pr-3 border border-brand-border rounded-xl text-sm bg-brand-bg-soft text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary/40" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
          <option value="">All Statuses</option>
          {['draft', 'pending', 'approved', 'rejected', 'cancelled', 'disputed'].map(k => (
            <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>
          ))}
        </select>
        <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} className="h-9 border border-brand-border rounded-xl px-3 text-sm bg-brand-bg-soft text-brand-text focus:outline-none">
          <option value="">All Leave Types</option>
          {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        {(search || status || leaveTypeId) && (
          <button onClick={() => { setSearch(''); setStatus(''); setLeaveTypeId(''); }} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text px-2 py-1 rounded-lg hover:bg-brand-bg-muted transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-16">No leave requests found.</p>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 130px 140px 90px 110px 90px' }}>
            {['Employee', 'Department', 'Leave Type', 'Days', 'Dates', ''].map(h => (
              <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {requests.map(r => {
            return (
              <div key={r._id} style={{ gridTemplateColumns: '1fr 130px 140px 90px 110px 90px' }}
                className="grid border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors items-center">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-brand-text">{r.employee?.fullName ?? 'Unknown'}</p>
                  <p className="text-xs text-brand-text-muted">{r.employee?.staffNumber}</p>
                </div>
                <div className="px-4 py-3 text-xs text-brand-text-secondary">{r.employee?.department}</div>
                <div className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.leaveType?.color}22`, color: r.leaveType?.color }}>
                    {r.leaveType?.name}
                  </span>
                </div>
                <div className="px-4 py-3 text-xs text-brand-text-secondary">{r.totalDays}d</div>
                <div className="px-4 py-3 text-xs text-brand-text-secondary">{fmtDate(r.startDate)}</div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <StatusBadge status={LEAVE_STATUS_MAP[r.status] ?? 'inactive'} label={r.status} className="capitalize" />
                  <Link href={`/${locale}/leave/requests/${r._id}`} className="text-brand-primary hover:text-brand-primary-hover transition-colors"><ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
