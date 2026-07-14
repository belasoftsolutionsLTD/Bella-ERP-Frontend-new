'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Check, X, RotateCcw, FileText, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveRequest } from '../Hooks/useLeaveRequests';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-brand-bg-muted', text: 'text-brand-text-secondary' },
  pending:   { label: 'Pending',   bg: 'bg-amber-500/15', text: 'text-amber-400' },
  approved:  { label: 'Approved',  bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-500/15', text: 'text-red-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-brand-bg-muted', text: 'text-brand-text-secondary' },
  disputed:  { label: 'Disputed',  bg: 'bg-purple-500/15', text: 'text-purple-400' },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function RequestDetailPage({ requestId }: { requestId: string }) {
  const locale = useLocale();
  const { request, loading, approve, reject, cancel, revoke, resolveDispute } = useLeaveRequest(requestId);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  if (!request) return <p className="text-sm text-brand-text-muted text-center py-16">Request not found.</p>;

  const cfg = STATUS_CFG[request.status] ?? STATUS_CFG.pending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/${locale}/leave/requests`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Requests
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-brand-text">{request.employee?.fullName ?? 'Unknown Employee'}</h1>
          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>{cfg.label}</span>
        </div>
        <p className="text-sm text-brand-text-secondary mt-0.5">{request.employee?.department} · {request.employee?.staffNumber}</p>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-brand-text-muted text-xs">Leave Type</p><p className="text-brand-text font-medium">{request.leaveType?.name}</p></div>
          <div><p className="text-brand-text-muted text-xs">Total Days</p><p className="text-brand-text font-medium">{request.totalDays}</p></div>
          <div><p className="text-brand-text-muted text-xs">Start Date</p><p className="text-brand-text">{fmtDate(request.startDate)}</p></div>
          <div><p className="text-brand-text-muted text-xs">End Date</p><p className="text-brand-text">{fmtDate(request.endDate)}</p></div>
          {request.halfDay && <div><p className="text-brand-text-muted text-xs">Half Day</p><p className="text-brand-text capitalize">{request.halfDay.period} of {fmtDate(request.halfDay.date)}</p></div>}
          <div className="sm:col-span-2"><p className="text-brand-text-muted text-xs">Reason</p><p className="text-brand-text">{request.reason || '—'}</p></div>
          {request.attachmentUrl && (
            <div className="sm:col-span-2">
              <a href={request.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                <FileText className="h-3.5 w-3.5" /> View attachment
              </a>
            </div>
          )}
        </div>
      </div>

      {request.status === 'disputed' && request.disputeReason && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-300 mb-1">Dispute Reason</p>
          <p className="text-sm text-purple-200">{request.disputeReason}</p>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => resolveDispute('overturned', undefined, () => toast.success('Dispute overturned — leave approved.'))}
              className="h-8 px-3 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold rounded-lg transition-colors">
              Overturn (Approve)
            </button>
            <button onClick={() => resolveDispute('upheld', undefined, () => toast.success('Original rejection upheld.'))}
              className="h-8 px-3 bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold rounded-lg transition-colors">
              Uphold (Keep Rejected)
            </button>
          </div>
        </div>
      )}

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-3">Approval Chain</h3>
        {request.approvalChain.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No approval required for this leave type — auto-approved.</p>
        ) : (
          <div className="space-y-2">
            {request.approvalChain.map(step => (
              <div key={step.level} className={cn('flex items-center justify-between px-3 py-2 rounded-lg border',
                step.level === request.currentApprovalLevel && request.status === 'pending' ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-brand-border/60')}>
                <div>
                  <p className="text-sm text-brand-text">Level {step.level}: {step.approverName} <span className="text-brand-text-muted text-xs capitalize">({step.approverRole})</span></p>
                  {step.comment && <p className="text-xs text-brand-text-muted italic mt-0.5">"{step.comment}"</p>}
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                  step.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : step.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-brand-bg-muted text-brand-text-secondary')}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {request.status === 'pending' && (
        <div className="flex items-center gap-2">
          <button onClick={() => approve(undefined, () => toast.success('Approved.'))}
            className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Check className="h-4 w-4" /> Approve
          </button>
          <button onClick={() => setShowReject(true)}
            className="flex items-center gap-1.5 h-9 px-4 bg-brand-danger hover:bg-brand-danger/90 text-white text-sm font-semibold rounded-lg transition-colors">
            <X className="h-4 w-4" /> Reject
          </button>
        </div>
      )}
      {showReject && (
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-3">
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="Rejection reason…"
            className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-red-500 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReject(false)} className="text-xs text-brand-text-secondary hover:text-brand-text px-3 py-1.5">Cancel</button>
            <button onClick={() => reject(rejectReason, () => { toast.success('Rejected.'); setShowReject(false); })} disabled={!rejectReason.trim()}
              className="h-8 px-4 bg-brand-danger hover:bg-brand-danger/90 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
              Confirm Reject
            </button>
          </div>
        </div>
      )}
      {(request.status === 'pending' || request.status === 'draft') && (
        <button onClick={() => cancel(() => toast.success('Cancelled.'))}
          className="flex items-center gap-1.5 h-9 px-4 border border-brand-border text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
          Cancel Request
        </button>
      )}
      {request.status === 'approved' && (
        <button onClick={() => { if (window.confirm('Revoke this approved leave?')) revoke(() => toast.success('Revoked.')); }}
          className="flex items-center gap-1.5 h-9 px-4 border border-amber-700 text-amber-400 hover:text-amber-300 text-sm font-semibold rounded-lg transition-colors">
          <RotateCcw className="h-4 w-4" /> Revoke Approval
        </button>
      )}

      {request.auditLog && request.auditLog.length > 0 && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5"><ActivityIcon className="h-3.5 w-3.5" /> Audit Log</h3>
          <div className="space-y-3">
            {request.auditLog.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-brand-text-muted text-xs shrink-0 w-32">{fmtDateTime(entry.timestamp)}</span>
                <div>
                  <p className="text-brand-text-secondary capitalize">{entry.action.replace(/([A-Z])/g, ' $1')} {entry.performedByName ? `by ${entry.performedByName}` : ''}</p>
                  {entry.comment && <p className="text-xs text-brand-text-muted italic">"{entry.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
