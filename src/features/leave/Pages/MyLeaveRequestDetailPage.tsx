'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, FileText, Activity as ActivityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openFile, resolveUploadUrl } from '@/functions/downloadFile';
import { useMyLeaveRequestDetail, useMyLeaveRequests } from '../Hooks/useMyLeave';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-slate-100', text: 'text-slate-500' },
  pending:   { label: 'Pending',   bg: 'bg-amber-100', text: 'text-amber-700' },
  approved:  { label: 'Approved',  bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-500' },
  disputed:  { label: 'Disputed',  bg: 'bg-orange-100', text: 'text-orange-700' },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function MyLeaveRequestDetailPage({ locale, requestId }: { locale: string; requestId: string }) {
  const { request, loading, refetch } = useMyLeaveRequestDetail(requestId);
  const { cancel, dispute } = useMyLeaveRequests();
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>;
  if (!request) return <p className="text-sm text-slate-400 text-center py-16">Request not found.</p>;

  const cfg = STATUS_CFG[request.status] ?? STATUS_CFG.pending;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link href={`/${locale}/my/leave/requests`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> My Requests
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-brand-text">{request.leaveType?.name ?? 'Leave'}</h1>
          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>{cfg.label}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs">Start Date</p><p className="text-slate-800 font-medium">{fmtDate(request.startDate)}</p></div>
          <div><p className="text-slate-400 text-xs">End Date</p><p className="text-slate-800 font-medium">{fmtDate(request.endDate)}</p></div>
          <div><p className="text-slate-400 text-xs">Total Days</p><p className="text-slate-800 font-medium">{request.totalDays}</p></div>
          {request.halfDay && <div><p className="text-slate-400 text-xs">Half Day</p><p className="text-slate-800 capitalize">{request.halfDay.period} of {fmtDate(request.halfDay.date)}</p></div>}
          <div className="sm:col-span-2"><p className="text-slate-400 text-xs">Reason</p><p className="text-slate-800">{request.reason || '—'}</p></div>
          {request.attachmentUrl && (
            <div className="sm:col-span-2">
              <button onClick={() => openFile(resolveUploadUrl(request.attachmentUrl!)).catch(err => toast.error(err.message))}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" /> View attachment
              </button>
            </div>
          )}
          {request.status === 'rejected' && request.rejectionReason && (
            <div className="sm:col-span-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 mb-0.5">Rejection Reason</p>
              <p className="text-sm text-red-700">{request.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {request.status === 'disputed' && request.disputeReason && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-700 mb-1">Your Dispute</p>
          <p className="text-sm text-orange-800">{request.disputeReason}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Approval Chain</h3>
        {request.approvalChain.length === 0 ? (
          <p className="text-sm text-slate-400">No approval required for this leave type — auto-approved.</p>
        ) : (
          <div className="space-y-2">
            {request.approvalChain.map(step => (
              <div key={step.level} className={cn('flex items-center justify-between px-3 py-2 rounded-lg border',
                step.level === request.currentApprovalLevel && request.status === 'pending' ? 'border-primary/40 bg-primary/5' : 'border-slate-100')}>
                <div>
                  <p className="text-sm text-slate-800">Level {step.level}: {step.approverName} <span className="text-slate-400 text-xs capitalize">({step.approverRole})</span></p>
                  {step.comment && <p className="text-xs text-slate-500 italic mt-0.5">"{step.comment}"</p>}
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                  step.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500')}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(request.status === 'pending' || request.status === 'draft') && (
          <button onClick={() => { if (window.confirm('Cancel this leave request?')) cancel(request._id, () => { toast.success('Cancelled.'); refetch(); }); }}
            className="h-9 px-4 border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-lg transition-colors">
            Cancel Request
          </button>
        )}
        {request.status === 'rejected' && !showDispute && (
          <button onClick={() => setShowDispute(true)}
            className="h-9 px-4 border border-orange-200 text-orange-600 hover:text-orange-700 text-sm font-semibold rounded-lg transition-colors">
            Dispute This Decision
          </button>
        )}
      </div>

      {showDispute && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3} placeholder="Explain why you're disputing this rejection…"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-primary resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDispute(false)} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">Cancel</button>
            <button onClick={() => dispute(request._id, disputeReason, () => { toast.success('Dispute submitted.'); setShowDispute(false); refetch(); })} disabled={!disputeReason.trim()}
              className="h-8 px-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
              Submit Dispute
            </button>
          </div>
        </div>
      )}

      {request.auditLog && request.auditLog.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><ActivityIcon className="h-3.5 w-3.5" /> Activity</h3>
          <div className="space-y-3">
            {request.auditLog.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-slate-400 text-xs shrink-0 w-32">{fmtDateTime(entry.timestamp)}</span>
                <div>
                  <p className="text-slate-700 capitalize">{entry.action.replace(/([A-Z])/g, ' $1')} {entry.performedByName ? `by ${entry.performedByName}` : ''}</p>
                  {entry.comment && <p className="text-xs text-slate-400 italic">"{entry.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
