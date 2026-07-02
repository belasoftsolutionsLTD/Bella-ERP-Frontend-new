'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Eye, CheckCircle2, XCircle, RotateCcw, Trash2, AlertTriangle,
  X, CalendarDays, User, MessageSquare, Loader2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaveRequest } from '../Hooks/useLeave';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  disputed: 'bg-amber-100 text-amber-700',
};

interface Props {
  requests: LeaveRequest[];
  onApprove?:       (id: string, comments?: string) => void;
  onReject?:        (id: string, comments?: string) => void;
  onRevoke?:        (id: string, comments?: string) => void;
  onResolveDispute?: (id: string, resolution: 'approve' | 'reject', comments?: string) => void;
  onDelete?:        (id: string) => void;
}

type SortKey = 'employee' | 'leaveType' | 'startDate' | 'numberOfDays' | 'status';

export function LeaveRequestTable({ requests, onApprove, onReject, onRevoke, onResolveDispute, onDelete }: Props) {
  const t  = useTranslations('Leave');
  const tc = useTranslations('Common');

  const [modal, setModal]   = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortAsc, setSortAsc] = useState(false);

  const isHR = !!(onApprove || onReject);
  const colSpan = isHR ? 7 : 6;

  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      if (sortKey === 'employee')      { va = a.employee?.fullName ?? ''; vb = b.employee?.fullName ?? ''; }
      else if (sortKey === 'leaveType') { va = a.leaveType; vb = b.leaveType; }
      else if (sortKey === 'startDate') { va = a.startDate; vb = b.startDate; }
      else if (sortKey === 'numberOfDays') { va = a.numberOfDays; vb = b.numberOfDays; }
      else if (sortKey === 'status')   { va = a.status; vb = b.status; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [requests, sortKey, sortAsc]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(true); }
  };

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const closeModal = () => { setModal(null); setComment(''); };

  const act = (fn?: (id: string, ...args: any[]) => void, ...args: any[]) => {
    if (!fn || !modal) return;
    setBusy(true);
    fn(modal._id, ...args);
    setBusy(false);
    closeModal();
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 border-b">
            <tr>
              {isHR && (
                <th onClick={() => toggleSort('employee')}
                  className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                  <div className="flex items-center gap-1">Employee <SortIcon k="employee" /></div>
                </th>
              )}
              <th onClick={() => toggleSort('leaveType')}
                className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                <div className="flex items-center gap-1">{t('leaveType')} <SortIcon k="leaveType" /></div>
              </th>
              <th onClick={() => toggleSort('startDate')}
                className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                <div className="flex items-center gap-1">{t('startDate')} <SortIcon k="startDate" /></div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap">{t('endDate')}</th>
              <th onClick={() => toggleSort('numberOfDays')}
                className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                <div className="flex items-center gap-1">{t('numberOfDays')} <SortIcon k="numberOfDays" /></div>
              </th>
              <th onClick={() => toggleSort('status')}
                className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                <div className="flex items-center gap-1">{tc('status')} <SortIcon k="status" /></div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70 whitespace-nowrap">{tc('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={colSpan} className="text-center py-8 text-foreground/50">{tc('noResults')}</td></tr>
            ) : sorted.map(r => (
              <tr key={r._id} className="border-b last:border-0 hover:bg-gray-50 group">
                {isHR && (
                  <td className="px-4 py-3">
                    {r.employee ? (
                      <div>
                        <p className="font-medium text-foreground">{r.employee.fullName}</p>
                        <p className="text-xs text-foreground/40">{r.employee.staffNumber} · {r.employee.department}</p>
                      </div>
                    ) : (
                      <span className="text-foreground/30 text-xs font-mono">{String(r.employeeId).slice(-8)}</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 capitalize font-medium">{r.leaveType.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-foreground/70">{new Date(r.startDate).toLocaleDateString('en-KE')}</td>
                <td className="px-4 py-3 text-foreground/70">{new Date(r.endDate).toLocaleDateString('en-KE')}</td>
                <td className="px-4 py-3 font-semibold">{r.numberOfDays}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold capitalize', STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500')}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {/* View details — always */}
                    <ActionBtn icon={Eye} label="View" color="text-primary hover:bg-primary/10"
                      onClick={() => { setModal(r); setComment(''); }} />

                    {isHR && (
                      <>
                        {r.status === 'pending' && (
                          <>
                            <ActionBtn icon={CheckCircle2} label="Approve" color="text-emerald-600 hover:bg-emerald-50"
                              onClick={() => { setModal(r); setComment(''); }} />
                            <ActionBtn icon={XCircle} label="Reject" color="text-red-500 hover:bg-red-50"
                              onClick={() => { setModal(r); setComment(''); }} />
                          </>
                        )}
                        {r.status === 'approved' && (
                          <ActionBtn icon={RotateCcw} label="Revoke" color="text-amber-500 hover:bg-amber-50"
                            onClick={() => { setModal(r); setComment(''); }} />
                        )}
                        {r.status === 'disputed' && (
                          <ActionBtn icon={AlertTriangle} label="Review Dispute" color="text-amber-600 hover:bg-amber-50"
                            onClick={() => { setModal(r); setComment(''); }} />
                        )}
                        {/* Delete — confirm inline */}
                        {confirmDelete === r._id ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                            <button onClick={() => { onDelete?.(r._id); setConfirmDelete(null); }}
                              className="text-xs font-bold text-red-600 hover:underline">Yes</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-foreground/40">No</button>
                          </div>
                        ) : (
                          <ActionBtn icon={Trash2} label="Delete" color="text-foreground/30 hover:text-red-500 hover:bg-red-50"
                            onClick={() => setConfirmDelete(r._id)} />
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Details / Action modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className={cn('px-6 py-4 flex items-center justify-between',
              modal.status === 'pending'  ? 'bg-yellow-50 border-b border-yellow-200' :
              modal.status === 'approved' ? 'bg-emerald-50 border-b border-emerald-200' :
              modal.status === 'disputed' ? 'bg-amber-50 border-b border-amber-200' :
              'bg-red-50 border-b border-red-200')}>
              <div>
                <h2 className="font-bold text-foreground text-base capitalize">
                  {modal.leaveType.replace(/_/g, ' ')} Leave
                </h2>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block', STATUS_COLORS[modal.status])}>
                  {modal.status}
                </span>
              </div>
              <button onClick={closeModal} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Employee */}
              {modal.employee && (
                <InfoRow icon={User} label="Employee">
                  <p className="font-semibold text-foreground">{modal.employee.fullName}</p>
                  <p className="text-xs text-foreground/40">{modal.employee.staffNumber} · {modal.employee.department}</p>
                </InfoRow>
              )}

              {/* Dates */}
              <InfoRow icon={CalendarDays} label="Period">
                <p className="font-semibold text-foreground">
                  {new Date(modal.startDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })} –{' '}
                  {new Date(modal.endDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </p>
                <p className="text-xs text-foreground/40">{modal.numberOfDays} working day{modal.numberOfDays !== 1 ? 's' : ''}</p>
              </InfoRow>

              {/* Reason */}
              {modal.reason && (
                <InfoRow icon={MessageSquare} label="Reason">
                  <p className="text-sm text-foreground/80 leading-relaxed">{modal.reason}</p>
                </InfoRow>
              )}

              {/* HR comments */}
              {modal.comments && (
                <InfoRow icon={MessageSquare} label="HR Comment">
                  <p className="text-sm text-foreground/70 leading-relaxed italic">"{modal.comments}"</p>
                </InfoRow>
              )}

              {/* Dispute reason */}
              {modal.disputeReason && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Dispute Reason
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">{modal.disputeReason}</p>
                </div>
              )}

              {/* ── Action area ── */}
              {isHR && (
                <div className="border-t pt-4 space-y-3">
                  {(modal.status === 'pending' || modal.status === 'approved' || modal.status === 'disputed') && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">
                        {modal.status === 'pending' ? 'Comment (optional)' : 'Reason / Note'}
                      </label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={modal.status === 'pending' ? 'Add a comment…' : modal.status === 'approved' ? 'Reason for revoking…' : 'Resolution note…'}
                        rows={2}
                        className="w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {modal.status === 'pending' && (
                      <>
                        <ActionModalBtn
                          icon={CheckCircle2} label="Approve" busy={busy}
                          cls="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => act(onApprove, comment || undefined)}
                        />
                        <ActionModalBtn
                          icon={XCircle} label="Reject" busy={busy}
                          cls="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => act(onReject, comment || undefined)}
                        />
                      </>
                    )}
                    {modal.status === 'approved' && (
                      <ActionModalBtn
                        icon={RotateCcw} label="Revoke Leave" busy={busy}
                        cls="bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => act(onRevoke, comment || undefined)}
                      />
                    )}
                    {modal.status === 'disputed' && (
                      <>
                        <ActionModalBtn
                          icon={CheckCircle2} label="Approve Dispute" busy={busy}
                          cls="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => { if (onResolveDispute && modal) { setBusy(true); onResolveDispute(modal._id, 'approve', comment || undefined); setBusy(false); closeModal(); } }}
                        />
                        <ActionModalBtn
                          icon={XCircle} label="Reject Dispute" busy={busy}
                          cls="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => { if (onResolveDispute && modal) { setBusy(true); onResolveDispute(modal._id, 'reject', comment || undefined); setBusy(false); closeModal(); } }}
                        />
                      </>
                    )}
                    <button onClick={closeModal}
                      className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 transition-colors text-foreground/60">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Small helpers ── */
function ActionBtn({ icon: Icon, label, color, onClick }: { icon: typeof Eye; label: string; color: string; onClick: () => void }) {
  return (
    <button title={label} onClick={onClick}
      className={cn('h-7 w-7 flex items-center justify-center rounded-lg transition-colors', color)}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ActionModalBtn({ icon: Icon, label, busy, cls, onClick }: { icon: typeof Eye; label: string; busy: boolean; cls: string; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy}
      className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60', cls)}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof Eye; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
