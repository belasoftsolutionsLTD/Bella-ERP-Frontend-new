'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Download, Check, X, ChevronRight, Mail, FileText, ShieldCheck, AlertCircle, GitCompare } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { downloadFile } from '@/functions/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

type CycleStatus = 'open' | 'review' | 'locked' | 'closed';

interface PayrollCycle {
  _id: string; name: string;
  period: { month: number; year: number; startDate: string; endDate: string };
  payDate: string | null; status: CycleStatus; currency: string;
  totalGross: number; totalDeductions: number; totalNet: number; totalEmployerCost: number;
  employeeCount: number; hasExceptions: boolean; exceptionCount: number;
  payFrequency?: string; runType?: string;
}

interface PayrollResult {
  _id: string; employeeId: string;
  employee?: { fullName: string; staffNumber: string; department: string };
  grossPay: number; totalDeductions: number; netPay: number; totalEmployerCost: number;
  earnings: { conceptName: string; amount: number }[];
  deductions: { conceptName: string; amount: number }[];
  employerContributions: { conceptName: string; amount: number }[];
  benefits: { conceptName: string; amount: number }[];
  leave?: { leaveType: string; startDate: string; endDate: string; days: number; amount: number }[];
  hasException: boolean;
  exceptions: { type: string; message: string; severity: string }[];
  status: string; payslipUrl?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CycleStatus, { label: string; border: string; badge: string; text: string }> = {
  open:   { label: 'Open',   border: 'border-l-blue-500',   badge: 'bg-blue-500/15 text-blue-400',    text: 'text-blue-400'    },
  review: { label: 'Review', border: 'border-l-amber-500',  badge: 'bg-amber-500/15 text-amber-400',  text: 'text-amber-400'   },
  locked: { label: 'Locked', border: 'border-l-violet-500', badge: 'bg-violet-500/15 text-violet-400',text: 'text-violet-400'  },
  closed: { label: 'Closed', border: 'border-l-emerald-500',badge: 'bg-emerald-500/15 text-emerald-400',text:'text-emerald-400'},
};

const PIPELINE: CycleStatus[] = ['open', 'review', 'locked', 'closed'];

const fmt = (n: number, cur = 'KES') =>
  `${cur} ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── Pipeline ──────────────────────────────────────────────────────────────────

function Pipeline({ status }: { status: CycleStatus }) {
  const cur = PIPELINE.indexOf(status);
  return (
    <div className="flex items-center">
      {PIPELINE.map((step, i) => {
        const done = i < cur; const active = i === cur;
        const cfg = STATUS_CFG[step];
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn('h-5 w-5 rounded-full border-2 flex items-center justify-center',
                done   ? 'border-brand-primary bg-brand-primary' :
                active ? 'border-brand-primary bg-transparent ring-2 ring-brand-primary/30 ring-offset-1 ring-offset-slate-800' :
                         'border-brand-border bg-transparent')}>
                {done   && <Check className="h-2.5 w-2.5 text-white" />}
                {active && <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />}
              </div>
              <span className={cn('text-[10px] font-semibold capitalize', (done || active) ? cfg.text : 'text-brand-text-muted')}>{cfg.label}</span>
            </div>
            {i < PIPELINE.length - 1 && <div className={cn('h-0.5 w-10 mx-1 mb-4', done ? 'bg-brand-primary' : 'bg-brand-bg-muted')} />}
          </div>
        );
      })}
    </div>
  );
}

// ── New Cycle Modal ───────────────────────────────────────────────────────────

function NewCycleModal({ onClose, onCreated, offCycle }: { onClose: () => void; onCreated: () => void; offCycle?: boolean }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year,  setYear]  = useState(String(now.getFullYear()));
  const [payFrequency, setPayFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(offCycle ? 'monthly' : 'monthly');
  const [payGroup, setPayGroup] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offCycleReason, setOffCycleReason] = useState('');
  const [payDate, setPayDate] = useState('');
  const [saving, setSaving]   = useState(false);
  const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const needsExplicitRange = offCycle || payFrequency !== 'monthly';
  const name = offCycle
    ? (offCycleReason ? `Off-Cycle: ${offCycleReason}` : 'Off-Cycle Payroll Run')
    : needsExplicitRange
      ? `${payFrequency === 'weekly' ? 'Weekly' : 'Biweekly'} Payroll (${startDate || '…'} – ${endDate || '…'})`
      : `${mNames[parseInt(month)-1]} ${year} Payroll`;

  const canSubmit = needsExplicitRange ? (startDate && endDate) : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-bold text-brand-text">{offCycle ? 'New Off-Cycle Run' : 'New Payroll Cycle'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-brand-text-muted mb-1">Cycle name</p>
            <p className="text-sm font-bold text-indigo-300">{name}</p>
          </div>

          {offCycle && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Reason</label>
              <input value={offCycleReason} onChange={e => setOffCycleReason(e.target.value)} placeholder="e.g. Year-end bonus, termination payout" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          )}

          {!offCycle && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Pay Frequency</label>
              <select value={payFrequency} onChange={e => setPayFrequency(e.target.value as any)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="monthly">Monthly</option>
                <option value="biweekly">Biweekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}

          {!needsExplicitRange ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Month</label>
                <select value={month} onChange={e => setMonth(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  {mNames.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                  {[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Period Start</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Period End</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
          )}

          {!offCycle && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Pay Group</label>
              <input value={payGroup} onChange={e => setPayGroup(e.target.value)} placeholder="all" className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
              <p className="text-[11px] text-brand-text-muted mt-1">Leave as "all" to include every active employee on this pay frequency.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Pay Date (optional)</label>
            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={() => {
            setSaving(true);
            apiCallFunction({ url: `${API_BASE_URL}/payroll/cycles`, method: 'POST',
              data: {
                name, payDate: payDate || undefined, currency: 'KES',
                payFrequency: offCycle ? 'monthly' : payFrequency,
                payGroup: offCycle ? 'all' : payGroup,
                runType: offCycle ? 'off_cycle' : 'regular',
                offCycleReason: offCycle ? offCycleReason : undefined,
                ...(needsExplicitRange ? { startDate, endDate } : { month, year }),
              },
              thenFn: () => { onCreated(); onClose(); },
              finallyFn: () => setSaving(false),
            });
          }} disabled={saving || !canSubmit} className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Cycle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Detail Modal ───────────────────────────────────────────────────────

function ResultModal({ r, cur, cycleYear, onClose, onApprove, isHR }: {
  r: PayrollResult; cur: string; cycleYear: number; onClose: () => void; onApprove: () => void; isHR: boolean;
}) {
  const [showEmp, setShowEmp] = useState(false);
  const locale = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <p className="text-base font-bold text-brand-text">{r.employee?.fullName}</p>
            <p className="text-xs text-brand-text-muted">{r.employee?.department} · {r.employee?.staffNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {r.hasException && r.exceptions.map((ex, i) => (
            <div key={i} className={cn('flex gap-2 px-3 py-2 rounded-lg text-xs', ex.severity === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400')}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{ex.message}
            </div>
          ))}
          {/* Earnings */}
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-brand-border"><p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Earnings</p></div>
            {[...(r.earnings ?? []), ...(r.benefits ?? [])].map((e, i) => (
              <div key={i} className="flex justify-between px-4 py-2 border-b border-brand-border/50 last:border-0 text-sm">
                <span className="text-brand-text-secondary">{e.conceptName}</span><span className="font-semibold text-brand-text">{fmt(e.amount, cur)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-emerald-500/5 text-sm font-bold">
              <span className="text-emerald-400">Gross Pay</span><span className="text-emerald-300">{fmt(r.grossPay, cur)}</span>
            </div>
          </div>
          {/* Leave Taken */}
          {(r.leave?.length ?? 0) > 0 && (
            <div className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-brand-border"><p className="text-xs font-bold text-sky-400 uppercase tracking-wide">Leave Taken</p></div>
              {r.leave!.map((l, i) => (
                <div key={i} className="flex justify-between px-4 py-2 border-b border-brand-border/50 last:border-0 text-sm">
                  <span className="text-brand-text-secondary">{l.leaveType.charAt(0).toUpperCase()}{l.leaveType.slice(1)} Leave ({l.days} day{l.days === 1 ? '' : 's'})</span>
                  <span className="font-semibold text-brand-text">{l.amount > 0 ? `-${fmt(l.amount, cur)}` : 'Paid'}</span>
                </div>
              ))}
            </div>
          )}
          {/* Deductions */}
          <div className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-brand-border"><p className="text-xs font-bold text-red-400 uppercase tracking-wide">Deductions</p></div>
            {(r.deductions ?? []).map((d, i) => (
              <div key={i} className="flex justify-between px-4 py-2 border-b border-brand-border/50 last:border-0 text-sm">
                <span className="text-brand-text-secondary">{d.conceptName}</span><span className="font-semibold text-brand-text">{fmt(d.amount, cur)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-red-500/5 text-sm font-bold">
              <span className="text-red-400">Total Deductions</span><span className="text-red-300">{fmt(r.totalDeductions, cur)}</span>
            </div>
          </div>
          {/* Net */}
          <div className="bg-brand-primary/20 border border-brand-primary/30 rounded-xl px-4 py-4 flex justify-between">
            <span className="text-sm font-bold text-brand-text">NET PAY</span>
            <span className="text-xl font-black text-indigo-300">{fmt(r.netPay, cur)}</span>
          </div>
          {/* Employer contributions */}
          {(r.employerContributions ?? []).length > 0 && (
            <div className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
              <button className="w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold text-violet-400 uppercase tracking-wide" onClick={() => setShowEmp(v => !v)}>
                Employer Contributions <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', showEmp && 'rotate-90')} />
              </button>
              {showEmp && r.employerContributions.map((ec, i) => (
                <div key={i} className="flex justify-between px-4 py-2 border-t border-brand-border/50 text-sm">
                  <span className="text-brand-text-secondary">{ec.conceptName}</span><span className="text-brand-text-secondary">{fmt(ec.amount, cur)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isHR && (
          <div className="px-6 py-4 border-t border-brand-border shrink-0 space-y-2">
            {r.status === 'pending' && r.exceptions.some(e => e.severity === 'error') && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>This payslip has critical errors. Fix them before approving to avoid incorrect payments.</span>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              {r.payslipUrl && (
                <button onClick={() => downloadFile(r.payslipUrl!, 'payslip.pdf').catch(err => alert(err.message))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-border-strong text-brand-text-secondary text-sm font-semibold hover:text-brand-text transition-colors">
                  <Download className="h-4 w-4" /> Payslip
                </button>
              )}
              <button onClick={() => downloadFile(`${API_BASE_URL}/payroll/p9/${r.employeeId}?year=${cycleYear}`, `P9A-${r.employeeId}-${cycleYear}.pdf`).catch(err => alert(err.message))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-border-strong text-brand-text-secondary text-sm font-semibold hover:text-brand-text transition-colors">
                <FileText className="h-4 w-4" /> P9A ({cycleYear})
              </button>
              {r.status === 'pending' && (() => {
                const hasErrors = r.exceptions.some(e => e.severity === 'error');
                return (
                  <>
                    {hasErrors && (
                      <a href={`/${locale}/employees/${r.employeeId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors">
                        Fix Issues
                      </a>
                    )}
                    <button onClick={() => { onApprove(); onClose(); }} disabled={hasErrors}
                      title={hasErrors ? 'Resolve errors before approving' : undefined}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exceptions Panel ──────────────────────────────────────────────────────────

function ExceptionsPanel({ cycleId, onClose }: { cycleId: string; onClose: () => void }) {
  const [items, setItems] = useState<PayrollResult[]>([]);
  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/cycles/${cycleId}/exceptions`, showToast: false,
      thenFn: r => setItems(r.data ?? []) });
  }, [cycleId]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text">Payroll Exceptions</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {(['error','warning'] as const).map(sev => {
            const filtered = items.filter(r => r.exceptions.some(e => e.severity === sev));
            if (!filtered.length) return null;
            return (
              <div key={sev}>
                <p className={cn('text-xs font-bold uppercase tracking-wide mb-2', sev === 'error' ? 'text-red-400' : 'text-amber-400')}>
                  {sev === 'error' ? '🔴 Errors (must fix)' : '🟡 Warnings'}
                </p>
                <div className="space-y-2">
                  {filtered.map(r => r.exceptions.filter(e => e.severity === sev).map((ex, i) => (
                    <div key={i} className={cn('px-4 py-3 rounded-xl border text-xs', sev === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20')}>
                      <p className="font-semibold text-brand-text">{r.employee?.fullName}</p>
                      <p className={cn('mt-0.5', sev === 'error' ? 'text-red-400' : 'text-amber-400')}>{ex.message}</p>
                    </div>
                  )))}
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-center text-brand-text-muted py-8">No exceptions.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Readiness Modal ───────────────────────────────────────────────────────────

interface ReadinessEmployee {
  _id: string; fullName: string; staffNumber: string; department: string; designation: string;
  missing: string[]; hasCritical: boolean;
}

interface ReadinessData {
  total: number; incompleteCount: number; criticalCount: number; employees: ReadinessEmployee[];
}

function ReadinessModal({ onClose }: { onClose: () => void }) {
  const [data,    setData]    = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees/payroll-readiness`,
      showToast: false,
      thenFn: r => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-brand-text">Payroll Readiness</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
            </div>
          ) : !data ? (
            <p className="text-center text-brand-text-muted py-10">Failed to load readiness data.</p>
          ) : (
            <>
              {/* Summary chips */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Active employees', value: data.total,           color: 'text-brand-text' },
                  { label: 'Critical issues',  value: data.criticalCount,   color: data.criticalCount   > 0 ? 'text-red-400'   : 'text-emerald-400' },
                  { label: 'Warnings',         value: data.incompleteCount - data.criticalCount, color: (data.incompleteCount - data.criticalCount) > 0 ? 'text-amber-400' : 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
                    <p className="text-[11px] text-brand-text-muted uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {data.employees.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <ShieldCheck className="h-10 w-10 text-emerald-400" />
                  <p className="font-semibold text-emerald-400">All employees are payroll-ready</p>
                  <p className="text-sm text-brand-text-muted">No missing critical fields detected.</p>
                </div>
              ) : (
                <>
                  {data.criticalCount > 0 && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span><strong>{data.criticalCount} employee{data.criticalCount !== 1 ? 's are' : ' is'} missing critical fields</strong> — payroll cannot be locked until these are fixed.</span>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-brand-border">
                    <div className="grid bg-brand-bg-soft/60 border-b border-brand-border" style={{ gridTemplateColumns: '1fr 110px 140px' }}>
                      {['Employee', 'Department', 'Missing Fields'].map(h => (
                        <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
                      ))}
                    </div>
                    {data.employees.map(emp => (
                      <div key={emp._id} className="grid border-b border-brand-border/60 last:border-0 items-center" style={{ gridTemplateColumns: '1fr 110px 140px' }}>
                        <div className="px-4 py-3">
                          <p className="text-sm font-medium text-brand-text">{emp.fullName}</p>
                          <p className="text-[10px] text-brand-text-muted">{emp.staffNumber} · {emp.designation}</p>
                        </div>
                        <div className="px-4 py-3 text-xs text-brand-text-secondary">{emp.department}</div>
                        <div className="px-4 py-3 flex flex-wrap gap-1">
                          {emp.missing.map(m => {
                            const isCrit = ['Gross Pay', 'Job Group'].includes(m);
                            return (
                              <span key={m} className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                                isCrit ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400',
                              )}>{m}</span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border shrink-0 flex justify-between items-center">
          <p className="text-xs text-brand-text-muted">Red = blocks payroll · Amber = recommended before disbursement</p>
          <a href="/en/employees" className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors">
            Go to People →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Compare Cycles Modal ──────────────────────────────────────────────────────

interface EmployeeDiff {
  employeeId: string;
  employee: { fullName: string; staffNumber: string; department: string } | null;
  inCycleA: boolean; inCycleB: boolean;
  grossA: number; grossB: number; grossDiff: number;
  deductionsA: number; deductionsB: number; deductionsDiff: number;
  netA: number; netB: number; netDiff: number;
}

interface CompareData {
  cycleA: { _id: string; name: string; totalGross: number; totalDeductions: number; totalNet: number; employeeCount: number; currency: string };
  cycleB: { _id: string; name: string; totalGross: number; totalDeductions: number; totalNet: number; employeeCount: number; currency: string };
  employeeDiffs: EmployeeDiff[];
}

function DiffCell({ value, cur }: { value: number; cur: string }) {
  if (Math.abs(value) < 0.01) return <span className="text-brand-text-muted">—</span>;
  const positive = value > 0;
  return <span className={cn('font-semibold', positive ? 'text-emerald-400' : 'text-red-400')}>{positive ? '+' : ''}{fmt(value, cur)}</span>;
}

function CompareCyclesModal({ cycles, onClose }: { cycles: PayrollCycle[]; onClose: () => void }) {
  const [cycleAId, setCycleAId] = useState(cycles[1]?._id ?? '');
  const [cycleBId, setCycleBId] = useState(cycles[0]?._id ?? '');
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  const runCompare = useCallback(() => {
    if (!cycleAId || !cycleBId) return;
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/cycles/compare`, params: { cycleA: cycleAId, cycleB: cycleBId }, showToast: false,
      thenFn: r => setData(r.data ?? null),
      finallyFn: () => setLoading(false),
    });
  }, [cycleAId, cycleBId]);

  useEffect(() => { runCompare(); }, [runCompare]);

  const cur = data?.cycleB.currency ?? 'KES';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <h2 className="text-base font-bold text-brand-text flex items-center gap-2"><GitCompare className="h-4 w-4" /> Compare Payroll Runs</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 py-4 border-b border-brand-border shrink-0 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Run A (baseline)</label>
            <select value={cycleAId} onChange={e => setCycleAId(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Run B (compare to)</label>
            <select value={cycleBId} onChange={e => setCycleBId(e.target.value)} className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary">
              {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
          ) : !data ? (
            <p className="text-center text-brand-text-muted py-16">Select two runs to compare.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 px-6 py-4">
                {[
                  { label: 'Total Gross', a: data.cycleA.totalGross, b: data.cycleB.totalGross },
                  { label: 'Total Deductions', a: data.cycleA.totalDeductions, b: data.cycleB.totalDeductions },
                  { label: 'Total Net', a: data.cycleA.totalNet, b: data.cycleB.totalNet },
                ].map(({ label, a, b }) => (
                  <div key={label} className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
                    <p className="text-[11px] text-brand-text-muted uppercase tracking-wide mb-1">{label}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-brand-text-secondary">{fmt(a, cur)} → {fmt(b, cur)}</span>
                    </div>
                    <DiffCell value={Math.round((b - a) * 100) / 100} cur={cur} />
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <div className="bg-brand-bg-soft border border-brand-border rounded-xl overflow-hidden">
                  <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
                    {['Employee', 'Gross Δ', 'Deductions Δ', 'Net Δ'].map(h => (
                      <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
                    ))}
                  </div>
                  {data.employeeDiffs.map(d => (
                    <div key={d.employeeId} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }} className="grid border-b border-brand-border/50 last:border-0 items-center">
                      <div className="px-4 py-2.5 text-sm">
                        <p className="font-medium text-brand-text">{d.employee?.fullName ?? 'Unknown'}</p>
                        <p className="text-[10px] text-brand-text-muted">
                          {d.employee?.department}
                          {!d.inCycleA && <span className="ml-1.5 text-emerald-500">new in B</span>}
                          {!d.inCycleB && <span className="ml-1.5 text-red-500">dropped in B</span>}
                        </p>
                      </div>
                      <div className="px-4 py-2.5 text-sm"><DiffCell value={d.grossDiff} cur={cur} /></div>
                      <div className="px-4 py-2.5 text-sm"><DiffCell value={d.deductionsDiff} cur={cur} /></div>
                      <div className="px-4 py-2.5 text-sm"><DiffCell value={d.netDiff} cur={cur} /></div>
                    </div>
                  ))}
                  {data.employeeDiffs.length === 0 && <div className="py-10 text-center text-brand-text-muted text-sm">No employees in either run.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { isHR } = useAuth();
  const [cycles,       setCycles]       = useState<PayrollCycle[]>([]);
  const [activeCycle,  setActiveCycle]  = useState<PayrollCycle | null>(null);
  const [results,      setResults]      = useState<PayrollResult[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [newOpen,      setNewOpen]      = useState(false);
  const [offCycleOpen, setOffCycleOpen] = useState(false);
  const [compareOpen,  setCompareOpen]  = useState(false);
  const [excOpen,      setExcOpen]      = useState(false);
  const [detailR,      setDetailR]      = useState<PayrollResult | null>(null);
  const [advancing,    setAdvancing]    = useState(false);
  const [emailing,     setEmailing]     = useState(false);
  const [readyOpen,    setReadyOpen]    = useState(false);

  const fetchCycles = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/cycles?limit=50`, showToast: false,
      thenFn: r => {
        const all: PayrollCycle[] = r.data?.data ?? [];
        setCycles(all);
        setActiveCycle(all.find(c => c.status !== 'closed') ?? all[0] ?? null);
      },
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  const fetchResults = useCallback(() => {
    if (!activeCycle || activeCycle.status === 'open') { setResults([]); return; }
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/cycles/${activeCycle._id}/results?limit=200`, showToast: false,
      thenFn: r => setResults(r.data?.data ?? []) });
  }, [activeCycle]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const advanceStatus = () => {
    if (!activeCycle) return;
    setAdvancing(true);
    apiCallFunction({ url: `${API_BASE_URL}/payroll/cycles/${activeCycle._id}/status`, method: 'PUT', data: {},
      thenFn: () => fetchCycles(), finallyFn: () => setAdvancing(false) });
  };

  const approveEmployee = (resultId: string) => {
    if (!activeCycle) return;
    apiCallFunction({ url: `${API_BASE_URL}/payroll/cycles/${activeCycle._id}/approve`, method: 'POST',
      data: { employeeIds: [resultId] }, thenFn: () => fetchResults() });
  };

  const sendPayslipEmails = () => {
    if (!activeCycle) return;
    setEmailing(true);
    apiCallFunction({ url: `${API_BASE_URL}/payroll/cycles/${activeCycle._id}/email-payslips`, method: 'POST', data: {},
      thenFn: () => {}, finallyFn: () => setEmailing(false) });
  };

  const approveAll = () => {
    if (!activeCycle) return;
    apiCallFunction({ url: `${API_BASE_URL}/payroll/cycles/${activeCycle._id}/approve`, method: 'POST',
      data: { approveAll: true }, thenFn: () => fetchResults() });
  };

  const ac   = activeCycle;
  const cfg  = ac ? STATUS_CFG[ac.status] : null;
  const cur  = ac?.currency ?? 'KES';
  const past = cycles.filter(c => c !== ac);

  const actionLabel = ac?.status === 'open' ? 'Move to Review →'
    : ac?.status === 'review' ? 'Lock Payroll 🔒'
    : ac?.status === 'locked' ? 'Close & Distribute Payslips ✓'
    : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-brand-border/60 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-brand-text tracking-tight">Payroll</h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">{ac ? ac.name : 'No active cycle'}</p>
          </div>
          {isHR && (
            <div className="flex items-center gap-2">
              <a href="/en/payroll/employees" className="px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">Compensations</a>
              <a href="/en/payroll/concepts"  className="px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">Concepts</a>
              <a href="/en/payroll/analytics" className="px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">Analytics</a>
              <a href="/en/payroll/settings"  className="px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">Settings</a>
              <button onClick={() => setReadyOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">
                <ShieldCheck className="h-4 w-4" /> Check Readiness
              </button>
              <button onClick={() => setOffCycleOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">
                <Plus className="h-4 w-4" /> Off-Cycle Run
              </button>
              {cycles.length >= 2 && (
                <button onClick={() => setCompareOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border bg-brand-bg-soft text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors">
                  <GitCompare className="h-4 w-4" /> Compare Runs
                </button>
              )}
              <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors">
                <Plus className="h-4 w-4" /> New Cycle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /></div>
        ) : !ac ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-brand-text-secondary font-semibold">No payroll cycles yet</p>
            {isHR && <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold transition-colors"><Plus className="h-4 w-4" /> Create First Cycle</button>}
          </div>
        ) : (
          <>
            {/* Active Cycle Card */}
            <div className={cn('bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-6 border-l-4', cfg!.border)}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-black text-brand-text">{ac.name}</h2>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg!.badge)}>{cfg!.label}</span>
                  </div>
                  <p className="text-xs text-brand-text-muted">
                    {fmtDate(ac.period.startDate)} – {fmtDate(ac.period.endDate)}
                    {ac.payDate && ` · Pay date: ${fmtDate(ac.payDate)}`} · {ac.employeeCount} employees
                  </p>
                </div>
                <Pipeline status={ac.status} />
              </div>

              {ac.status !== 'open' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Gross',     value: fmt(ac.totalGross, cur)      },
                    { label: 'Total Deductions',value: fmt(ac.totalDeductions, cur) },
                    { label: 'Total Net',       value: fmt(ac.totalNet, cur)        },
                    { label: 'Employees',       value: String(ac.employeeCount)     },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/60 rounded-xl px-4 py-3">
                      <p className="text-[11px] text-brand-text-muted uppercase tracking-wide">{label}</p>
                      <p className="text-base font-bold text-brand-text mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {ac.hasExceptions && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {ac.exceptionCount} employee{ac.exceptionCount !== 1 ? 's have' : ' has'} issues that need attention
                  </div>
                  <button onClick={() => setExcOpen(true)} className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-400 hover:bg-amber-500/25 hover:text-amber-300 transition-colors">Review exceptions</button>
                </div>
              )}

              {isHR && (
                <div className="flex items-center gap-3 flex-wrap">
                  {actionLabel && (
                    <button onClick={advanceStatus} disabled={advancing}
                      className={cn('px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50',
                        ac.status === 'review' ? 'bg-amber-500 hover:bg-amber-400 text-white' :
                        ac.status === 'locked' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                                                  'bg-brand-primary hover:bg-brand-primary-hover text-white')}>
                      {advancing && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {actionLabel}
                    </button>
                  )}
                  {(ac.status === 'review' || ac.status === 'locked') && results.some(r => r.status === 'pending') && (
                    <button onClick={approveAll} className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-colors">Approve All</button>
                  )}
                  {(ac.status === 'locked' || ac.status === 'closed') && (
                    <button onClick={() => downloadFile(`${API_BASE_URL}/payroll/cycles/${ac._id}/export`, `payroll-${ac._id}.csv`).catch(err => alert(err.message))}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border-strong text-brand-text-secondary text-sm font-semibold hover:text-brand-text transition-colors">
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  )}
                  {ac.status === 'closed' && (
                    <button onClick={sendPayslipEmails} disabled={emailing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-primary/40 bg-brand-primary/10 text-indigo-400 text-sm font-semibold hover:bg-brand-primary-hover/20 disabled:opacity-50 transition-colors">
                      {emailing ? <span className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Mail className="h-4 w-4" />}
                      {emailing ? 'Sending…' : 'Email Payslips'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Employee Results Table */}
            {results.length > 0 && (
              <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-brand-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-brand-text">Employee Payroll Review</h3>
                  <span className="text-xs text-brand-text-muted">{results.length} employees</span>
                </div>
                <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 110px 110px 110px 80px 80px' }}>
                  {['Employee','Gross','Deductions','Net','Status','Actions'].map(h => (
                    <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
                  ))}
                </div>
                {results.map(r => {
                  const initials = (r.employee?.fullName ?? '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                  const sCfg = r.status === 'paid' || r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400'
                    : r.hasException ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400';
                  const sLabel = r.status === 'paid' ? 'Paid' : r.status === 'approved' ? 'Approved' : r.hasException ? 'Issues' : 'Pending';
                  return (
                    <div key={r._id} onClick={() => setDetailR(r)} style={{ gridTemplateColumns: '1fr 110px 110px 110px 80px 80px' }}
                      className="grid border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors cursor-pointer items-center">
                      <div className="px-4 py-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">{initials}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-brand-text truncate">{r.employee?.fullName}</p>
                          <p className="text-[10px] text-brand-text-muted">{r.employee?.department}</p>
                        </div>
                        {r.hasException && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="px-4 py-3 text-sm text-brand-text-secondary">{fmt(r.grossPay, cur)}</div>
                      <div className="px-4 py-3 text-sm text-brand-text-secondary">{fmt(r.totalDeductions, cur)}</div>
                      <div className="px-4 py-3 text-sm font-bold text-brand-text">{fmt(r.netPay, cur)}</div>
                      <div className="px-4 py-3"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', sCfg)}>{sLabel}</span></div>
                      <div className="px-4 py-3 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {isHR && r.status === 'pending' && (
                          <button onClick={() => approveEmployee(r._id)} className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {r.payslipUrl && (
                          <button onClick={e => { e.stopPropagation(); downloadFile(r.payslipUrl!, 'payslip.pdf').catch(err => alert(err.message)); }}
                            className="h-7 w-7 rounded-lg bg-brand-bg-muted flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Other Cycles — including any off-cycle or other-frequency runs alongside the active one */}
            {past.length > 0 && (
              <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-brand-border"><h3 className="text-sm font-bold text-brand-text">Other Cycles</h3></div>
                <div className="grid border-b border-brand-border bg-brand-bg-soft/60" style={{ gridTemplateColumns: '1fr 110px 80px 120px 120px 90px' }}>
                  {['Period','Pay Date','Employees','Gross','Net','Status'].map(h => (
                    <div key={h} className="px-4 py-2.5 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">{h}</div>
                  ))}
                </div>
                {past.map(c => (
                  <div key={c._id} onClick={() => setActiveCycle(c)} style={{ gridTemplateColumns: '1fr 110px 80px 120px 120px 90px' }}
                    className="grid border-b border-brand-border/60 last:border-0 hover:bg-brand-bg-soft/30 transition-colors items-center cursor-pointer">
                    <div className="px-4 py-3 text-sm font-medium text-brand-text">{c.name}{c.runType === 'off_cycle' && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 uppercase">Off-Cycle</span>}</div>
                    <div className="px-4 py-3 text-xs text-brand-text-secondary">{fmtDate(c.payDate)}</div>
                    <div className="px-4 py-3 text-sm text-brand-text-secondary">{c.employeeCount}</div>
                    <div className="px-4 py-3 text-sm text-brand-text-secondary">{fmt(c.totalGross, c.currency)}</div>
                    <div className="px-4 py-3 text-sm font-semibold text-brand-text">{fmt(c.totalNet, c.currency)}</div>
                    <div className="px-4 py-3"><span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', STATUS_CFG[c.status].badge)}>{STATUS_CFG[c.status].label}</span></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {newOpen   && <NewCycleModal onClose={() => setNewOpen(false)} onCreated={fetchCycles} />}
      {offCycleOpen && <NewCycleModal offCycle onClose={() => setOffCycleOpen(false)} onCreated={fetchCycles} />}
      {compareOpen && <CompareCyclesModal cycles={cycles} onClose={() => setCompareOpen(false)} />}
      {excOpen   && ac && <ExceptionsPanel cycleId={ac._id} onClose={() => setExcOpen(false)} />}
      {detailR   && ac && <ResultModal r={detailR} cur={cur} cycleYear={ac.period.year} onClose={() => setDetailR(null)} onApprove={() => approveEmployee(detailR._id)} isHR={isHR} />}
      {readyOpen && <ReadinessModal onClose={() => setReadyOpen(false)} />}
    </div>
  );
}
