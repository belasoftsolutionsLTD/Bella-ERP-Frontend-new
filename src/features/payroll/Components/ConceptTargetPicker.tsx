'use client';
import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useConfigSection } from '@/hooks/useConfigSection';

interface EmpOption { _id: string; fullName: string; department: string }

type TargetType = 'employees' | 'all' | 'department' | 'jobGroup';

const TARGET_OPTIONS: { value: TargetType; label: string; hint: string }[] = [
  { value: 'employees', label: 'Specific Employees', hint: 'Pick one or more people by name' },
  { value: 'department', label: 'A Department',      hint: 'Everyone currently in the department(s) you pick' },
  { value: 'jobGroup',   label: 'A Job Group',        hint: 'Everyone currently in the job group(s) you pick' },
  { value: 'all',        label: 'Everyone',           hint: 'Every employee, org-wide' },
];

interface ConceptTargetPickerProps {
  concept: { _id: string; name: string; type: string; subCategory: string };
  onClose: () => void;
  onAssigned: () => void;
}

// Assigns a Concept to one/several employees, a whole department, a whole job group,
// or everyone — the targeting layer that Concepts didn't have before (previously
// assignment only ever happened one employee at a time, from the Compensations page).
// For loan-shaped concepts (subCategory:'loans'), also offers an optional opening
// balance so an employee joining mid-repayment on a pre-existing loan doesn't have to
// start over from the full principal.
export function ConceptTargetPicker({ concept, onClose, onAssigned }: ConceptTargetPickerProps) {
  const isLoan = concept.subCategory === 'loans';
  const needsAmount = concept.type === 'fixed' || concept.type === 'variable';

  const [targetType, setTargetType] = useState<TargetType>('employees');
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set());
  const [selectedJobGroupIds, setSelectedJobGroupIds] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('');
  const [trackBalance, setTrackBalance] = useState(isLoan);
  const [principal, setPrincipal] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const departments = useConfigSection('departments');
  const jobGroups = useConfigSection('job-groups');

  useEffect(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/payroll/compensations/employees`, showToast: false,
      thenFn: r => setEmployees(r.data ?? []) });
  }, []);

  // A loan-like balance only makes sense against a single person's obligation, never a
  // shared group — steer away from balance-tracking automatically if the target widens.
  useEffect(() => {
    if (targetType !== 'employees' && trackBalance) setTrackBalance(false);
  }, [targetType, trackBalance]);

  const toggle = <T,>(set: Set<T>, setSet: (s: Set<T>) => void, val: T) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setSet(next);
  };

  const filteredEmployees = employees.filter(e =>
    !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase())
  );

  const isValid = (() => {
    if (targetType === 'employees') return selectedEmpIds.size > 0;
    if (targetType === 'department') return selectedDepartments.size > 0;
    if (targetType === 'jobGroup')   return selectedJobGroupIds.size > 0;
    return true; // 'all'
  })();

  const assign = () => {
    if (!isValid) return;
    setSaving(true);

    let target: Record<string, unknown>;
    if (targetType === 'employees') target = { type: 'employees', employeeIds: [...selectedEmpIds] };
    else if (targetType === 'department') target = { type: 'department', departments: [...selectedDepartments] };
    else if (targetType === 'jobGroup') target = { type: 'jobGroup', jobGroupIds: [...selectedJobGroupIds] };
    else target = { type: 'all' };

    const body: Record<string, unknown> = { target };
    if (needsAmount) body.amount = Number(amount) || 0;
    if (isLoan && targetType === 'employees' && trackBalance && principal) {
      body.principal = Number(principal);
      body.openingBalance = openingBalance ? Number(openingBalance) : Number(principal);
    }

    apiCallFunction({
      url: `${API_BASE_URL}/payroll/concepts/${concept._id}/assign`,
      method: 'POST',
      data: body,
      thenFn: () => { onAssigned(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md flex flex-col bg-white border border-brand-border rounded-2xl shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-brand-text">Assign Concept</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Who does &quot;{concept.name}&quot; apply to?</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Target type */}
          <div className="grid grid-cols-2 gap-2">
            {TARGET_OPTIONS.map(o => (
              <button key={o.value} type="button" onClick={() => setTargetType(o.value)}
                title={o.hint}
                className={cn(
                  'px-3 py-2.5 rounded-xl border text-left transition-all',
                  targetType === o.value ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg-soft hover:border-brand-border-strong',
                )}>
                <p className={cn('text-xs font-semibold', targetType === o.value ? 'text-indigo-300' : 'text-brand-text-secondary')}>{o.label}</p>
              </button>
            ))}
          </div>

          {/* Specific employees */}
          {targetType === 'employees' && (
            <div>
              <div className="relative mb-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employees…"
                  className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div className="max-h-40 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/50">
                {filteredEmployees.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs text-brand-text-muted">No employees found.</p>
                ) : filteredEmployees.slice(0, 100).map(e => {
                  const sel = selectedEmpIds.has(e._id);
                  return (
                    <button key={e._id} type="button" onClick={() => toggle(selectedEmpIds, setSelectedEmpIds, e._id)}
                      className={cn('w-full flex items-center justify-between px-3 py-2 text-left hover:bg-brand-bg-muted/40 transition-colors', sel && 'bg-brand-primary/10')}>
                      <span className="text-sm text-brand-text truncate">{e.fullName}</span>
                      <span className="text-[10px] text-brand-text-muted">{e.department}</span>
                    </button>
                  );
                })}
              </div>
              {selectedEmpIds.size > 0 && <p className="mt-1 text-[11px] text-brand-text-muted">{selectedEmpIds.size} selected</p>}
            </div>
          )}

          {/* Department */}
          {targetType === 'department' && (
            <div className="max-h-40 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/50">
              {departments.loading ? (
                <p className="px-3 py-2.5 text-xs text-brand-text-muted">Loading…</p>
              ) : departments.items.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-brand-text-muted">No departments configured.</p>
              ) : departments.items.map(d => {
                const sel = selectedDepartments.has(d.name);
                return (
                  <button key={d._id} type="button" onClick={() => toggle(selectedDepartments, setSelectedDepartments, d.name)}
                    className={cn('w-full text-left px-3 py-2 text-sm text-brand-text hover:bg-brand-bg-muted/40 transition-colors', sel && 'bg-brand-primary/10')}>
                    {d.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Job Group */}
          {targetType === 'jobGroup' && (
            <div className="max-h-40 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/50">
              {jobGroups.loading ? (
                <p className="px-3 py-2.5 text-xs text-brand-text-muted">Loading…</p>
              ) : jobGroups.items.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-brand-text-muted">No job groups configured.</p>
              ) : jobGroups.items.map(g => {
                const sel = selectedJobGroupIds.has(g._id);
                return (
                  <button key={g._id} type="button" onClick={() => toggle(selectedJobGroupIds, setSelectedJobGroupIds, g._id)}
                    className={cn('w-full text-left px-3 py-2 text-sm text-brand-text hover:bg-brand-bg-muted/40 transition-colors', sel && 'bg-brand-primary/10')}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Amount — only for fixed/variable types; percentage/formula/bracket compute automatically */}
          {needsAmount && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Amount per cycle</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} placeholder="0"
                className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
          )}

          {/* Loan balance tracking — individual employees only */}
          {isLoan && targetType === 'employees' && (
            <div className="border border-brand-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-text">Track a payoff balance</p>
                  <p className="text-[11px] text-brand-text-muted">Deducts each cycle until fully repaid, then auto-unassigns</p>
                </div>
                <button type="button" onClick={() => setTrackBalance(v => !v)}
                  className={cn('h-5 w-9 rounded-full relative transition-colors shrink-0', trackBalance ? 'bg-brand-primary' : 'bg-brand-bg-muted')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', trackBalance ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>
              {trackBalance && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Principal</label>
                    <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} min={0} placeholder="e.g. 60000"
                      className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1">Opening balance</label>
                    <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} min={0}
                      placeholder={principal || 'Defaults to principal'}
                      className="w-full h-9 px-3 bg-brand-bg-soft border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
                  </div>
                  <p className="col-span-2 text-[11px] text-brand-text-muted">Leave opening balance blank unless this employee already paid some of it off elsewhere — e.g. a loan carried over from a previous employer.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button type="button" onClick={assign} disabled={saving || !isValid}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
