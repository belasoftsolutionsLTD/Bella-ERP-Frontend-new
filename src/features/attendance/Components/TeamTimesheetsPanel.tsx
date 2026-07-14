'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Send, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface TeamTimesheet {
  _id: string;
  employeeId: string;
  employee: { fullName: string; staffNumber?: string; department?: string } | null;
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  overtimeMinutes: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
}

const STATUS_CFG = {
  draft:     { label: 'Draft',     cls: 'bg-brand-bg-muted text-brand-text-secondary',     icon: Clock         },
  submitted: { label: 'Submitted', cls: 'bg-brand-primary/10 text-indigo-400 border border-brand-primary/20', icon: Send },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: CheckCircle },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: AlertCircle },
};

function fmtDuration(mins: number) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TeamTimesheetsPanel() {
  const [status, setStatus] = useState<'submitted' | 'approved' | 'rejected' | ''>('submitted');
  const [sheets, setSheets] = useState<TeamTimesheet[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchSheets = useCallback(() => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/timesheets${qs}`,
      showToast: false,
      thenFn: (r) => { setSheets(r.data ?? []); setSelected(new Set()); },
      finallyFn: () => setLoading(false),
    });
  }, [status]);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = sheets.filter((s) => s.status === 'submitted').map((s) => s._id);
    setSelected((prev) => prev.size === selectable.length ? new Set() : new Set(selectable));
  };

  const approveOne = (id: string) => {
    setBusy(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/timesheets/${id}/approve`,
      method: 'PUT',
      data: {},
      thenFn: () => fetchSheets(),
      finallyFn: () => setBusy(false),
    });
  };

  const submitReject = () => {
    if (!rejecting || !rejectReason.trim()) { toast.error('Please provide a reason.'); return; }
    setBusy(true);
    apiCallFunction({
      url: `${API_BASE_URL}/attendance/timesheets/${rejecting}/reject`,
      method: 'PUT',
      data: { reason: rejectReason },
      thenFn: () => { setRejecting(null); setRejectReason(''); fetchSheets(); },
      finallyFn: () => setBusy(false),
    });
  };

  const bulkApprove = () => {
    if (!selected.size) return;
    setBusy(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/attendance/timesheets/bulk-approve`,
      method: 'PUT',
      data: { timesheetIds: [...selected] },
      thenFn: (r) => {
        toast.success(r.message ?? 'Timesheets approved.');
        fetchSheets();
      },
      finallyFn: () => setBusy(false),
    });
  };

  const selectableCount = sheets.filter((s) => s.status === 'submitted').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center bg-brand-bg-soft rounded-lg p-0.5">
          {(['submitted', 'approved', 'rejected', ''] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors',
                status === s ? 'bg-brand-bg-muted text-indigo-400' : 'text-brand-text-secondary hover:text-brand-text-secondary',
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {selectableCount > 0 && (
          <button
            onClick={bulkApprove}
            disabled={busy || !selected.size}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            <CheckCircle className="h-4 w-4" /> Approve Selected ({selected.size})
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : sheets.length === 0 ? (
        <div className="py-16 text-center text-brand-text-muted text-sm">No timesheets found for this filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table className="w-full text-sm border-collapse bg-brand-bg-soft">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg-soft/60 text-left">
                {selectableCount > 0 && (
                  <th className="px-3 py-2.5 w-8">
                    <input type="checkbox" checked={selected.size === selectableCount && selectableCount > 0} onChange={toggleAll} className="rounded" />
                  </th>
                )}
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold">Employee</th>
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold">Week</th>
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold text-right">Regular</th>
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold text-right">Overtime</th>
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold">Status</th>
                <th className="px-3 py-2.5 text-[11px] text-brand-text-secondary uppercase tracking-wide font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((s) => {
                const cfg = STATUS_CFG[s.status];
                const canApprove = s.status === 'submitted';
                return (
                  <tr key={s._id} className="border-b border-brand-border/60 hover:bg-brand-bg-soft/30 transition-colors">
                    {selectableCount > 0 && (
                      <td className="px-3 py-2.5">
                        {canApprove && (
                          <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggle(s._id)} className="rounded" />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-brand-text">{s.employee?.fullName ?? 'Unknown'}</p>
                      <p className="text-xs text-brand-text-muted">{s.employee?.department ?? ''}</p>
                    </td>
                    <td className="px-3 py-2.5 text-brand-text-secondary text-xs">
                      {new Date(s.weekStart).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – {new Date(s.weekEnd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-3 py-2.5 text-right text-brand-text-secondary">{fmtDuration((s.totalMinutes || 0) - (s.overtimeMinutes || 0))}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn('font-semibold', s.overtimeMinutes > 0 ? 'text-amber-400' : 'text-brand-text-muted')}>{fmtDuration(s.overtimeMinutes)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit', cfg.cls)}>
                        <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {canApprove && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => approveOne(s._id)} disabled={busy}
                            className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-40">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setRejecting(s._id); setRejectReason(''); }} disabled={busy}
                            className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejecting(null)} />
          <div className="relative z-10 bg-white border border-brand-border rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <p className="font-bold text-brand-text">Reject Timesheet</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} autoFocus
              placeholder="Reason for rejection…"
              className="w-full bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setRejecting(null)} className="flex-1 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">
                Cancel
              </button>
              <button onClick={submitReject} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-brand-danger hover:bg-brand-danger/90 disabled:opacity-50 text-sm font-bold text-white transition-colors">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
