'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CalendarDays, Plus, Clock, Users, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { useMyLeaveBalances, useMyLeaveRequests, useMyLeaveCalendar } from '../Hooks/useMyLeave';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const LEAVE_STATUS_MAP: Record<string, Status> = {
  draft: 'draft', pending: 'pending', approved: 'approved', rejected: 'rejected',
  cancelled: 'cancelled', disputed: 'pending',
};

const BALANCE_COLORS = [
  'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-fuchsia-500 to-violet-600',
];

export default function MyLeaveDashboardPage() {
  const locale = useLocale();
  const { balances, loading: balancesLoading } = useMyLeaveBalances();
  const { requests, loading: requestsLoading } = useMyLeaveRequests();
  const { mine, team, holidays, loading: calendarLoading } = useMyLeaveCalendar();

  const upcoming = mine
    .filter(r => r.status === 'approved' && new Date(r.endDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const nextHoliday = holidays
    .map((h: any) => ({ ...h, dateObj: new Date(h.date) }))
    .filter((h: any) => h.dateObj >= new Date(new Date().toDateString()))
    .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">My Leave</h1>
          <p className="text-sm text-brand-text-secondary">Balances, requests, and time off</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/my/leave/calendar`} className="flex items-center gap-1.5 h-9 px-3.5 border border-brand-border bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
            <CalendarDays className="h-4 w-4" /> Calendar
          </Link>
          <Link href={`/${locale}/my/leave/apply`} className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Apply for Leave
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Leave Balances</h2>
        {balancesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
        ) : balances.length === 0 ? (
          <p className="text-sm text-brand-text-secondary text-center py-6">No leave balances found. Contact HR if this looks wrong.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {balances.map((b, i) => (
              <div key={b._id} className={cn('rounded-xl bg-gradient-to-br p-4 text-white shadow-sm', BALANCE_COLORS[i % BALANCE_COLORS.length])}>
                <p className="text-xs font-semibold text-white/70">{b.leaveType?.name ?? 'Leave'}</p>
                <p className="text-3xl font-bold mt-1">{b.closingBalance}</p>
                <p className="text-xs text-white/60 mt-0.5">days remaining</p>
                {b.pending > 0 && <p className="text-[11px] text-white/60 mt-1">{b.pending} pending</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Recent Requests</h2>
            <Link href={`/${locale}/my/leave/requests`} className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          {requestsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary/40" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-brand-text-secondary text-center py-8">No leave requests yet.</p>
          ) : (
            <div>
              {requests.slice(0, 6).map(r => (
                <Link key={r._id} href={`/${locale}/my/leave/requests/${r._id}`}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{r.leaveType?.name ?? 'Leave'}</p>
                    <p className="text-xs text-brand-text-secondary">{fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.totalDays}d</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={LEAVE_STATUS_MAP[r.status] ?? 'inactive'} label={r.status} className="text-xs px-2.5 py-1" />
                    <ChevronRight className="h-4 w-4 text-brand-text-secondary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-1.5"><Users className="h-4 w-4" /> Team Away</h2>
          </div>
          {calendarLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary/40" /></div>
          ) : team.length === 0 ? (
            <p className="text-sm text-brand-text-secondary text-center py-8">No one from your department is currently on leave.</p>
          ) : (
            <div>
              {team.slice(0, 6).map((r: any) => (
                <div key={r._id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0">
                  <p className="text-sm font-medium text-slate-800">{r.employee?.fullName ?? 'Colleague'}</p>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.leaveType?.color}22`, color: r.leaveType?.color }}>
                    {r.leaveType?.name}
                  </span>
                  <span className="text-xs text-brand-text-secondary">{fmtDate(r.startDate)} – {fmtDate(r.endDate)}</span>
                </div>
              ))}
            </div>
          )}
          {nextHoliday && (
            <div className="px-4 py-3 bg-primary/5 border-t border-slate-100">
              <p className="text-xs text-brand-text-muted">Next public holiday</p>
              <p className="text-sm font-semibold text-slate-800">{nextHoliday.name} · {fmtDate(nextHoliday.date)}</p>
            </div>
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Upcoming Approved Leave</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 5).map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.leaveType?.name ?? 'Leave'}</p>
                  <p className="text-xs text-brand-text-secondary">{fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.totalDays}d</p>
                </div>
                <StatusBadge status={LEAVE_STATUS_MAP[r.status] ?? 'inactive'} label={r.status} className="text-xs px-2.5 py-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
