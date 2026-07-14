'use client';
import { useCallback, useEffect, useState } from 'react';
import { History, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { Wrapper } from '@/components/custom-ui/Wrapper';

interface JobHistoryEntry {
  _id: string;
  changeType: 'hire' | 'promotion' | 'transfer' | 'salaryChange' | 'titleChange' | 'managerChange' | 'departmentChange' | 'statusChange' | 'termination';
  effectiveDate: string;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  reason?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

const CHANGE_TYPE_LABEL: Record<string, string> = {
  hire: 'Hired', promotion: 'Promotion', transfer: 'Transfer', salaryChange: 'Salary Change',
  titleChange: 'Title Change', managerChange: 'Manager Change', departmentChange: 'Department Change',
  statusChange: 'Status Change', termination: 'Termination',
};

const CHANGE_TYPE_COLOR: Record<string, string> = {
  hire: 'bg-emerald-100 text-emerald-700', promotion: 'bg-violet-100 text-violet-700',
  transfer: 'bg-blue-100 text-blue-700', salaryChange: 'bg-amber-100 text-amber-700',
  titleChange: 'bg-brand-primary/10 text-brand-primary', managerChange: 'bg-cyan-100 text-cyan-700',
  departmentChange: 'bg-fuchsia-100 text-fuchsia-700', statusChange: 'bg-slate-200 text-slate-700',
  termination: 'bg-red-100 text-red-700',
};

const FIELD_LABELS: Record<string, string> = {
  designation: 'Designation', department: 'Department', grossPay: 'Gross Pay',
  status: 'Status', employmentType: 'Employment Type',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtValue = (field: string, v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  if (field === 'grossPay') return `KES ${Number(v).toLocaleString()}`;
  return String(v);
};

function DiffRow({ field, previousValues, newValues }: { field: string; previousValues: Record<string, unknown>; newValues: Record<string, unknown> }) {
  const label = FIELD_LABELS[field] ?? field;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-foreground/50 w-32 shrink-0">{label}</span>
      <span className="text-foreground/70">{fmtValue(field, previousValues[field])}</span>
      <ArrowRight className="h-3 w-3 text-foreground/30 shrink-0" />
      <span className="font-medium text-foreground">{fmtValue(field, newValues[field])}</span>
    </div>
  );
}

export function JobHistoryTab({ employeeId }: { employeeId: string }) {
  const [entries, setEntries] = useState<JobHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    apiCallFunction<any>({ url: `${API_BASE_URL}/employees/${employeeId}/job-history`, showToast: false,
      thenFn: (r) => setEntries(r.data ?? []), catchFn: () => setError('Failed to load job history.'),
      finallyFn: () => setLoading(false) });
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading || error) return <Wrapper loading={loading} error={error} onRetry={fetch}><div /></Wrapper>;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-foreground/40 gap-2">
        <History className="h-10 w-10" />
        <p className="text-sm">No job history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => {
        const changedFields = Object.keys(entry.newValues || {}).filter(k => k !== 'managerName' && k !== 'managerId');
        return (
          <div key={entry._id} className="rounded-xl border bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', CHANGE_TYPE_COLOR[entry.changeType] ?? 'bg-slate-100 text-slate-600')}>
                  {CHANGE_TYPE_LABEL[entry.changeType] ?? entry.changeType}
                </span>
                <span className="text-xs text-foreground/40">{fmtDate(entry.effectiveDate)}</span>
              </div>
              {entry.changedByName && <span className="text-xs text-foreground/40">by {entry.changedByName}</span>}
            </div>
            <div className="space-y-1.5">
              {'managerId' in (entry.newValues || {}) && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground/50 w-32 shrink-0">Manager</span>
                  <span className="text-foreground/70">{String((entry.previousValues as any).managerName ?? '—')}</span>
                  <ArrowRight className="h-3 w-3 text-foreground/30 shrink-0" />
                  <span className="font-medium text-foreground">{String((entry.newValues as any).managerName ?? '—')}</span>
                </div>
              )}
              {changedFields.map(field => (
                <DiffRow key={field} field={field} previousValues={entry.previousValues} newValues={entry.newValues} />
              ))}
            </div>
            {entry.reason && <p className="text-xs text-foreground/50 italic pt-1 border-t">{entry.reason}</p>}
          </div>
        );
      })}
    </div>
  );
}
