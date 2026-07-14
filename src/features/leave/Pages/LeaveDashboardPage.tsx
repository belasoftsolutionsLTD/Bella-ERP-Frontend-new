'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { CalendarDays, Clock, TrendingUp, Users, ClipboardList, Settings, BarChart2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveRequests, useLeaveRequest } from '../Hooks/useLeaveRequests';
import { useLeaveCalendar } from '../Hooks/useLeaveCalendar';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—';

function ApprovalRow({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const { request, approve, reject } = useLeaveRequest(requestId);
  if (!request) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-text truncate">{request.employee?.fullName ?? 'Unknown'}</p>
        <p className="text-xs text-brand-text-muted">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1" style={{ backgroundColor: `${request.leaveType?.color}22`, color: request.leaveType?.color }}>
            {request.leaveType?.name}
          </span>
          {fmtDate(request.startDate)} – {fmtDate(request.endDate)} · {request.totalDays}d
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => approve(undefined, () => { toast.success('Approved.'); onDone(); })}
          className="flex items-center gap-1 h-8 px-3 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold rounded-lg transition-colors">
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button onClick={() => { const reason = window.prompt('Rejection reason:'); if (reason) reject(reason, () => { toast.success('Rejected.'); onDone(); }); }}
          className="flex items-center gap-1 h-8 px-3 bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold rounded-lg transition-colors">
          <X className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

export default function LeaveDashboardPage() {
  const locale = useLocale();
  const { requests: pending, loading: pendingLoading, refetch: refetchPending } = useLeaveRequests({ status: 'pending' });
  const { requests: allApproved } = useLeaveRequests({ status: 'approved' });
  const todayStr = new Date().toISOString().slice(0, 10);
  const { entries: outToday } = useLeaveCalendar({ startDate: todayStr, endDate: todayStr });

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return allApproved.filter(r => new Date(r.startDate).getMonth() === now.getMonth() && new Date(r.startDate).getFullYear() === now.getFullYear()).length;
  }, [allApproved]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Leave Management</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Approvals, balances, and team time off</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/leave/types`} className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <Settings className="h-4 w-4" /> Leave Types
          </Link>
          <Link href={`/${locale}/leave/analytics`} className="flex items-center gap-2 h-9 px-4 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Approval', value: pending.length, color: 'text-amber-400', icon: Clock },
          { label: 'On Leave Today', value: outToday.length, color: 'text-cyan-400', icon: Users },
          { label: 'Requests This Month', value: thisMonthCount, color: 'text-indigo-400', icon: CalendarDays },
          { label: 'Approved (Total)', value: allApproved.length, color: 'text-emerald-400', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-4 text-center">
            <p className={cn('text-2xl font-bold flex items-center justify-center gap-1.5', color)}><Icon className="h-4 w-4" /> {value}</p>
            <p className="text-xs text-brand-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Pending Approvals</h2>
            <Link href={`/${locale}/leave/requests?status=pending`} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
          </div>
          {pendingLoading ? (
            <div className="py-12 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-10">No pending requests. Nice work.</p>
          ) : pending.slice(0, 8).map(r => <ApprovalRow key={r._id} requestId={r._id} onDone={refetchPending} />)}
        </div>

        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5"><Users className="h-4 w-4" /> Who's Out Today</h2>
            <Link href={`/${locale}/leave/calendar`} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Calendar</Link>
          </div>
          {outToday.length === 0 ? (
            <p className="text-sm text-brand-text-muted text-center py-10">Everyone's in today.</p>
          ) : outToday.map(r => (
            <div key={r._id} className="flex items-center justify-between px-4 py-3 border-b border-brand-border/60 last:border-0">
              <p className="text-sm font-medium text-brand-text">{r.employee?.fullName ?? 'Unknown'}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.leaveType?.color}22`, color: r.leaveType?.color }}>
                {r.leaveType?.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
