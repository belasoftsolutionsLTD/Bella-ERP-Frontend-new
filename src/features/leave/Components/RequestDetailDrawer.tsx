'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { leaveColor, LEAVE_TYPE_LABELS, STATUS_CFG } from '../constants';
import type { LeaveRequest } from '../constants';

interface Props {
  requestId: string;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onDecline?: (id: string, reason: string) => void;
  isManager?: boolean;
  isHR?: boolean;
  onUpdated?: () => void;
}

const DECLINE_REASONS = [
  'Insufficient balance',
  'Team coverage needed',
  'Blackout period',
  'Overlapping requests',
  'Other',
];

export function RequestDetailDrawer({ requestId, onClose, onApprove, onDecline, isManager, isHR, onUpdated }: Props) {
  const [request,         setRequest]         = useState<LeaveRequest | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [showDecline,     setShowDecline]     = useState(false);
  const [declineReason,   setDeclineReason]   = useState('');
  const [customReason,    setCustomReason]    = useState('');
  const [actioning,       setActioning]       = useState(false);
  const [disputeComments, setDisputeComments] = useState('');

  useEffect(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/leave/requests/${requestId}`,
      showToast: false,
      thenFn: r => setRequest(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [requestId]);

  const handleApprove = () => {
    if (!request) return;
    setActioning(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${request._id}/approve`,
      method: 'PUT',
      data: {},
      thenFn: () => { onApprove?.(request._id); onUpdated?.(); onClose(); },
      finallyFn: () => setActioning(false),
    });
  };

  const handleDecline = () => {
    if (!request || !declineReason) return;
    const reason = declineReason === 'Other' ? customReason : declineReason;
    setActioning(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${request._id}/decline`,
      method: 'PUT',
      data: { comments: reason },
      thenFn: () => { onDecline?.(request._id, reason); onUpdated?.(); onClose(); },
      finallyFn: () => setActioning(false),
    });
  };

  const handleResolveDispute = (resolution: 'approve' | 'reject') => {
    if (!request) return;
    setActioning(true);
    apiCallFunction({
      url: `${API_BASE_URL}/leave/requests/${request._id}/resolve-dispute`,
      method: 'PUT',
      data: { resolution, comments: disputeComments || undefined },
      thenFn: () => { onUpdated?.(); onClose(); },
      finallyFn: () => setActioning(false),
    });
  };

  const color     = request ? leaveColor(request.leaveType) : '#6366f1';
  const typeLabel = request ? (request.leaveTypeName ?? LEAVE_TYPE_LABELS[request.leaveType] ?? request.leaveType) : '';
  const stCfg     = request ? (STATUS_CFG[request.status] ?? STATUS_CFG.pending) : STATUS_CFG.pending;
  const totalDays = request?.numberOfDays ?? request?.totalDays ?? 0;

  const initials = request?.employee?.fullName
    ? request.employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium' });
  }

  function fmtDateTime(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-base font-bold"
              style={{ backgroundColor: color + '25', color }}>
              {loading ? '…' : initials}
            </div>
            <div>
              {loading ? (
                <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-base font-bold text-slate-100">{request?.employee?.fullName ?? 'Employee'}</p>
              )}
              <p className="text-xs text-slate-500">Leave Request</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {request && (
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full', stCfg.darkBg, stCfg.darkText)}>
                {stCfg.label}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : request ? (
            <div className="space-y-5">

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left */}
                <div className="space-y-3">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                    <InfoRow label="Leave Type">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: color + '20', color }}>{typeLabel}</span>
                    </InfoRow>
                    <InfoRow label="From">{fmtDate(request.startDate)}</InfoRow>
                    <InfoRow label="To">{fmtDate(request.endDate)}</InfoRow>
                    <InfoRow label="Working Days"><span className="font-bold text-slate-100">{totalDays}</span></InfoRow>
                    <InfoRow label="Submitted">{fmtDateTime(request.createdAt)}</InfoRow>
                    {request.approvedBy && <InfoRow label="Actioned by">{request.approvedByName ?? request.approvedBy}</InfoRow>}
                    {request.approvedAt && <InfoRow label="Actioned on">{fmtDateTime(request.approvedAt)}</InfoRow>}
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-3">
                  {request.reason && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Reason / Notes</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{request.reason}</p>
                    </div>
                  )}
                  {(request.declineReason ?? request.comments) && request.status !== 'pending' && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                      <p className="text-[11px] text-red-400 uppercase tracking-wide mb-1.5">Decline Reason</p>
                      <p className="text-sm text-slate-300">{request.declineReason ?? request.comments}</p>
                    </div>
                  )}
                  {request.isHalfDay && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <p className="text-xs text-slate-400">
                        Half day — <span className="font-semibold text-slate-200 capitalize">{request.halfDayPeriod}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance impact */}
              <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{typeLabel} Balance Impact</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] text-slate-500">Days requested</p>
                    <p className="text-lg font-bold text-slate-100">{totalDays}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-700" />
                  <div>
                    <p className="text-[11px] text-slate-500">Status</p>
                    <p className={cn('text-lg font-bold', stCfg.darkText)}>{stCfg.label}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {request.timeline && request.timeline.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Timeline</p>
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-700" />
                    <div className="space-y-4">
                      {request.timeline.map((ev, i) => (
                        <div key={i} className="flex gap-4 pl-9 relative">
                          <div className="absolute left-2 top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-slate-900" />
                          <div>
                            <p className="text-sm font-semibold text-slate-200 capitalize">
                              {ev.action.replace('_', ' ')}
                              {ev.performedByName && <span className="text-slate-400 font-normal"> by {ev.performedByName}</span>}
                            </p>
                            <p className="text-[11px] text-slate-600">{fmtDateTime(ev.timestamp)}</p>
                            {ev.note && <p className="text-xs text-slate-400 mt-0.5">{ev.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dispute section */}
              {request.status === 'disputed' && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                    <p className="text-sm font-bold text-orange-400">Leave Dispute Filed</p>
                  </div>
                  {request.disputeReason && (
                    <p className="text-sm text-slate-300 leading-relaxed">{request.disputeReason}</p>
                  )}
                  {isHR && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-slate-500">Resolution notes (optional)</p>
                      <textarea
                        value={disputeComments}
                        onChange={e => setDisputeComments(e.target.value)}
                        placeholder="Add a note for the employee…"
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Decline form */}
              {showDecline && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-100">Reason for declining</p>
                  <div className="space-y-2">
                    {DECLINE_REASONS.map(r => (
                      <button key={r} type="button" onClick={() => setDeclineReason(r)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                          declineReason === r
                            ? 'border-red-500 bg-red-500/10 text-red-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600')}>
                        <div className={cn('h-3.5 w-3.5 rounded-full border-2 shrink-0',
                          declineReason === r ? 'border-red-500 bg-red-500' : 'border-slate-600')} />
                        {r}
                      </button>
                    ))}
                    {declineReason === 'Other' && (
                      <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
                        placeholder="Please specify…" rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500 resize-none" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDecline(false)}
                      className="flex-1 py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-700 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleDecline}
                      disabled={!declineReason || (declineReason === 'Other' && !customReason.trim()) || actioning}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                      {actioning ? 'Declining…' : 'Confirm Decline'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-600">Request not found.</div>
          )}
        </div>

        {/* Dispute resolution footer */}
        {isHR && request?.status === 'disputed' && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
            <button onClick={() => handleResolveDispute('reject')} disabled={actioning}
              className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" /> Reject Dispute
            </button>
            <button onClick={() => handleResolveDispute('approve')} disabled={actioning}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> {actioning ? 'Resolving…' : 'Approve Dispute'}
            </button>
          </div>
        )}

        {/* Footer actions */}
        {isManager && request?.status === 'pending' && !showDecline && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
            <button onClick={() => setShowDecline(true)}
              className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" /> Decline
            </button>
            <button onClick={handleApprove} disabled={actioning}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> {actioning ? 'Approving…' : 'Approve Request'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-300">{children}</span>
    </div>
  );
}
