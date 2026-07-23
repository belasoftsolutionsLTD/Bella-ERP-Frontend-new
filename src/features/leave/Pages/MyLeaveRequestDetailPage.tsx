'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, FileText, Activity as ActivityIcon, Printer, Download } from 'lucide-react';
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
  counter_offered: { label: 'Counter-Offered', bg: 'bg-sky-100', text: 'text-sky-700' },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function MyLeaveRequestDetailPage({ locale, requestId }: { locale: string; requestId: string }) {
  const { request, loading, refetch } = useMyLeaveRequestDetail(requestId);
  const { cancel, dispute, acceptCounter, disputeCounter } = useMyLeaveRequests();
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showCounterDispute, setShowCounterDispute] = useState(false);
  const [counterDisputeReason, setCounterDisputeReason] = useState('');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>;
  if (!request) return <p className="text-sm text-slate-400 text-center py-16">Request not found.</p>;

  const cfg = STATUS_CFG[request.status] ?? STATUS_CFG.pending;

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const employeeName = request.employee?.fullName ?? 'Employee';
    const lines = [
      ['Employee', employeeName],
      ['Leave Type', request.leaveType?.name ?? '—'],
      ['Start Date', fmtDate(request.startDate)],
      ['End Date', fmtDate(request.endDate)],
      ['Number of Days', String(request.totalDays)],
      ['Status', cfg.label],
    ];
    if (request.proposedDays != null) {
      lines.push(['Proposed Days', String(request.proposedDays)]);
      if (request.counterOfferReason) lines.push(['Counter-Offer Reason', request.counterOfferReason]);
    }
    if (request.status === 'rejected' && request.rejectionReason) lines.push(['Rejection Reason', request.rejectionReason]);
    if (request.status === 'disputed' && request.disputeReason) lines.push(['Dispute Reason', request.disputeReason]);

    doc.setFontSize(16);
    doc.text('Leave Request', 14, 18);
    doc.setFontSize(11);
    let y = 32;
    for (const [label, value] of lines) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 70, y, { maxWidth: 125 });
      y += 10;
    }
    doc.save(`leave-request-${request._id}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #leave-print-area, #leave-print-area * { visibility: visible; }
          #leave-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print">
        <Link href={`/${locale}/my/leave/requests`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-text mb-1.5 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> My Requests
        </Link>
      </div>

      <div id="leave-print-area" className="space-y-5">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-brand-text">{request.leaveType?.name ?? 'Leave'}</h1>
          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>{cfg.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 no-print">
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg transition-colors">
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
        <button onClick={() => handleDownloadPdf().catch(() => toast.error('Failed to generate PDF.'))}
          className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg transition-colors">
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
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

      {request.status === 'counter_offered' && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-sky-700 mb-0.5">Counter-Offer</p>
            <p className="text-sm text-sky-800">HR has proposed <strong>{request.proposedDays} day(s)</strong> instead of the {request.totalDays} you requested.</p>
            {request.counterOfferReason && <p className="text-xs text-sky-700 italic mt-1">"{request.counterOfferReason}"</p>}
          </div>
          {!showCounterDispute && (
            <div className="flex items-center gap-2">
              <button onClick={() => acceptCounter(request._id, () => { toast.success('Counter-offer accepted.'); refetch(); })}
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors">
                Accept
              </button>
              <button onClick={() => setShowCounterDispute(true)}
                className="h-8 px-4 border border-orange-300 text-orange-600 hover:text-orange-700 text-xs font-semibold rounded-lg transition-colors">
                Dispute
              </button>
            </div>
          )}
          {showCounterDispute && (
            <div className="space-y-2">
              <textarea value={counterDisputeReason} onChange={e => setCounterDisputeReason(e.target.value)} rows={3} placeholder="Explain why you're disputing this counter-offer…"
                className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-orange-400 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCounterDispute(false)} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">Cancel</button>
                <button
                  onClick={() => disputeCounter(request._id, counterDisputeReason, () => { toast.success('Dispute submitted.'); setShowCounterDispute(false); refetch(); })}
                  disabled={!counterDisputeReason.trim()}
                  className="h-8 px-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  Submit Dispute
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
      </div>

      <div className="flex items-center gap-2 flex-wrap no-print">
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 no-print">
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
