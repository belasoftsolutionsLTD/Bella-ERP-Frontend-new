'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Check, X, RotateCcw, FileText, FileDown, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/custom-ui/ConfirmDialog';
import { useLeaveRequest } from '../Hooks/useLeaveRequests';
import { generateLeaveHistoryReport } from '../reportGenerator';

// Guaranteed HR-only actions (see backend/src/routes/leave/leave.js route guards) —
// approve/reject/cancel can also be a direct manager or dept head acting as an approval-
// chain step, so those keep showing the real approver's name (legitimate, expected
// information). Only these three are always performed by HR/super_admin specifically.
const HR_ONLY_ACTIONS = new Set(['revoked', 'disputeResolved', 'counterOffered']);

const LEAVE_STATUS_MAP: Record<string, Status> = {
  draft: 'draft', pending: 'pending', approved: 'approved', rejected: 'rejected',
  cancelled: 'cancelled', disputed: 'pending',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function RequestDetailPage({ requestId }: { requestId: string }) {
  const locale = useLocale();
  const { request, loading, approve, reject, cancel, revoke, resolveDispute, counterOffer } = useLeaveRequest(requestId);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [proposedDays, setProposedDays] = useState('');
  const [counterOfferReason, setCounterOfferReason] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<'approve' | 'cancel' | 'revoke' | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportUri, setReportUri] = useState<string | null>(null);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;
  if (!request) return <p className="text-sm text-brand-text-muted text-center py-16">Request not found.</p>;

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      setReportUri(await generateLeaveHistoryReport({
        employeeId: request.employeeId, employeeName: request.employee?.fullName, staffNumber: request.employee?.staffNumber,
      }));
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/${locale}/leave/requests`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Requests
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-brand-text">{request.employee?.fullName ?? 'Unknown Employee'}</h1>
              <StatusBadge status={LEAVE_STATUS_MAP[request.status] ?? 'inactive'} label={request.status} className="capitalize" />
            </div>
            <p className="text-sm text-brand-text-secondary mt-0.5">{request.employee?.department} · {request.employee?.staffNumber}</p>
          </div>
          <button onClick={generateReport} disabled={generatingReport}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text text-xs font-semibold transition-colors disabled:opacity-50">
            {generatingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            {generatingReport ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-brand-text-muted text-xs">Leave Type</p><p className="text-brand-text font-medium">{request.leaveType?.name}</p></div>
          <div><p className="text-brand-text-muted text-xs">Total Days</p><p className="text-brand-text font-medium">{request.totalDays}</p></div>
          <div><p className="text-brand-text-muted text-xs">Start Date</p><p className="text-brand-text">{fmtDate(request.startDate)}</p></div>
          <div><p className="text-brand-text-muted text-xs">End Date</p><p className="text-brand-text">{fmtDate(request.endDate)}</p></div>
          {request.halfDay && <div><p className="text-brand-text-muted text-xs">Half Day</p><p className="text-brand-text capitalize">{request.halfDay.period} of {fmtDate(request.halfDay.date)}</p></div>}
          <div className="sm:col-span-2"><p className="text-brand-text-muted text-xs">Reason</p><p className="text-brand-text">{request.reason || '—'}</p></div>
          <div className="sm:col-span-2">
            {request.attachmentUrl ? (
              <a href={request.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                <FileText className="h-3.5 w-3.5" /> View attachment
              </a>
            ) : (
              <p className="text-xs text-brand-text-muted">No attachment</p>
            )}
          </div>
        </div>
      </div>

      {request.status === 'disputed' && request.disputeReason && (() => {
        // A counter-offer dispute resolves to an approval either way (at the original
        // days if overturned, at the previously-proposed days if upheld) — it never had
        // a flat rejection to "keep", unlike a straight rejection dispute.
        const isCounterDispute = request.proposedDays != null;
        return (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-purple-300 mb-1">Dispute Reason</p>
            <p className="text-sm text-purple-200">{request.disputeReason}</p>
            {isCounterDispute && (
              <p className="text-xs text-purple-200/70 mt-1">
                Employee disputed HR's counter-offer of {request.proposedDays} day(s) instead of the {request.totalDays} originally requested.
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => resolveDispute('overturned', undefined, () => toast.success(isCounterDispute ? `Approved at the original ${request.totalDays} day(s).` : 'Dispute overturned — leave approved.'))}
                className="h-8 px-3 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold rounded-lg transition-colors">
                {isCounterDispute ? `Overturn (Approve ${request.totalDays} days)` : 'Overturn (Approve)'}
              </button>
              <button onClick={() => resolveDispute('upheld', undefined, () => toast.success(isCounterDispute ? `Counter-offer upheld — approved at ${request.proposedDays} day(s).` : 'Original rejection upheld.'))}
                className="h-8 px-3 bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold rounded-lg transition-colors">
                {isCounterDispute ? `Uphold Counter-Offer (${request.proposedDays} days)` : 'Uphold (Keep Rejected)'}
              </button>
            </div>
          </div>
        );
      })()}

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

      {request.status === 'counter_offered' && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-sky-300 mb-1">Counter-Offer Sent</p>
          <p className="text-sm text-sky-200">Proposed {request.proposedDays} day(s) instead of {request.totalDays}.</p>
          {request.counterOfferReason && <p className="text-xs text-sky-200/80 italic mt-1">"{request.counterOfferReason}"</p>}
          <p className="text-xs text-sky-200/60 mt-2">Awaiting the employee's response.</p>
        </div>
      )}
      {request.status === 'pending' && (
        <div className="flex items-center gap-2">
          <button onClick={() => setPendingConfirm('approve')}
            className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Check className="h-4 w-4" /> Approve
          </button>
          <button onClick={() => setShowReject(true)}
            className="flex items-center gap-1.5 h-9 px-4 bg-brand-danger hover:bg-brand-danger/90 text-white text-sm font-semibold rounded-lg transition-colors">
            <X className="h-4 w-4" /> Reject
          </button>
          <button onClick={() => setShowCounter(true)}
            className="flex items-center gap-1.5 h-9 px-4 border border-sky-600 text-sky-400 hover:text-sky-300 text-sm font-semibold rounded-lg transition-colors">
            Counter Offer
          </button>
        </div>
      )}
      {showCounter && (
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Proposed Days (of {request.totalDays} requested)</label>
            <input type="number" min={1} max={request.totalDays - 1} value={proposedDays} onChange={e => setProposedDays(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-sky-500" />
          </div>
          <textarea value={counterOfferReason} onChange={e => setCounterOfferReason(e.target.value)} rows={2} placeholder="Reason for the counter-offer…"
            className="w-full px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-sky-500 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCounter(false)} className="text-xs text-brand-text-secondary hover:text-brand-text px-3 py-1.5">Cancel</button>
            <button
              onClick={() => counterOffer(Number(proposedDays), counterOfferReason, () => { toast.success('Counter-offer sent.'); setShowCounter(false); })}
              disabled={!proposedDays || Number(proposedDays) <= 0 || Number(proposedDays) >= request.totalDays}
              className="h-8 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
              Send Counter-Offer
            </button>
          </div>
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
        <button onClick={() => setPendingConfirm('cancel')}
          className="flex items-center gap-1.5 h-9 px-4 border border-brand-border text-brand-text-secondary hover:text-brand-text text-sm font-semibold rounded-lg transition-colors">
          Cancel Request
        </button>
      )}
      {request.status === 'approved' && (
        <button onClick={() => setPendingConfirm('revoke')}
          className="flex items-center gap-1.5 h-9 px-4 border border-amber-700 text-amber-400 hover:text-amber-300 text-sm font-semibold rounded-lg transition-colors">
          <RotateCcw className="h-4 w-4" /> Revoke Approval
        </button>
      )}

      {pendingConfirm && (
        <ConfirmDialog
          title={
            pendingConfirm === 'approve' ? 'Approve this leave request?' :
            pendingConfirm === 'cancel'  ? 'Cancel this leave request?' :
            'Revoke this approved leave?'
          }
          message={
            pendingConfirm === 'approve' ? 'The employee will be notified and their leave balance will be updated.' :
            pendingConfirm === 'cancel'  ? "This can't be undone." :
            "This puts the days back on the employee's balance and notifies them. This can't be undone."
          }
          confirmLabel={pendingConfirm === 'approve' ? 'Approve' : pendingConfirm === 'cancel' ? 'Cancel Request' : 'Revoke Approval'}
          variant={pendingConfirm === 'approve' ? 'default' : 'danger'}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={() => {
            if (pendingConfirm === 'approve') approve(undefined, () => toast.success('Approved.'));
            if (pendingConfirm === 'cancel') cancel(() => toast.success('Cancelled.'));
            if (pendingConfirm === 'revoke') revoke(() => toast.success('Revoked.'));
            setPendingConfirm(null);
          }}
        />
      )}

      {request.auditLog && request.auditLog.length > 0 && (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5"><ActivityIcon className="h-3.5 w-3.5" /> Audit Log</h3>
          <div className="space-y-3">
            {request.auditLog.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-brand-text-muted text-xs shrink-0 w-32">{fmtDateTime(entry.timestamp)}</span>
                <div>
                  <p className="text-brand-text-secondary capitalize">
                    {entry.action.replace(/([A-Z])/g, ' $1')}
                    {entry.performedByName ? ` by ${HR_ONLY_ACTIONS.has(entry.action) ? 'HR' : entry.performedByName}` : ''}
                  </p>
                  {entry.comment && <p className="text-xs text-brand-text-muted italic">"{entry.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportUri(null)} />
          <div className="relative z-10 w-full max-w-2xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-800">Leave History Report{request.employee?.fullName ? ` — ${request.employee.fullName}` : ''}</p>
              <button onClick={() => setReportUri(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <iframe src={reportUri} title="Leave History Report" className="flex-1 w-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
