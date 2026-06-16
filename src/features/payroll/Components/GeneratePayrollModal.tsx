'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/custom-ui/CurrencyInput';
import { fmtCurrency } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Employee { _id: string; fullName: string; staffNumber: string; designation: string; grossPay?: number; jobGroupId?: string }
interface LineItem { label: string; amount: string }
interface FixedAllowance { _id: string; name: string; amount: number; isEnabled: boolean; jobGroupIds?: string[] }
interface DeductionType { _id: string; name: string; type: 'fixed' | 'percentage'; amount?: number; percentage?: number; isEnabled: boolean; jobGroupIds?: string[] }

interface Props {
  defaultMonth: number;
  defaultYear: number;
  onClose: () => void;
  onSuccess: () => void;
}

function calcNSSF(gross: number) {
  const t1 = Math.min(gross, 7000) * 0.06;
  const t2 = Math.max(0, Math.min(gross, 36000) - 7000) * 0.06;
  return Math.round((t1 + t2) * 100) / 100;
}
function calcPAYE(gross: number) {
  const nssf = calcNSSF(gross);
  const taxable = Math.max(0, gross - nssf);
  let tax = 0, rem = taxable;
  const bands = [{ limit: 24000, rate: 0.10 }, { limit: 8333, rate: 0.25 }, { limit: 467667, rate: 0.30 }, { limit: 300000, rate: 0.325 }];
  for (const b of bands) { if (rem <= 0) break; tax += Math.min(rem, b.limit) * b.rate; rem -= Math.min(rem, b.limit); }
  if (rem > 0) tax += rem * 0.35;
  return Math.round(Math.max(0, tax - 2400) * 100) / 100;
}
const calcSHA = (gross: number) => Math.round(gross * 0.0275 * 100) / 100;

export function GeneratePayrollModal({ defaultMonth, defaultYear, onClose, onSuccess }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fixedAllowances, setFixedAllowances] = useState<FixedAllowance[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear]   = useState(defaultYear);
  const [deductions, setDeductions] = useState<LineItem[]>([]);
  const [allowances, setAllowances] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees`,
      params: { limit: 500, status: 'active' },
      showToast: false,
      thenFn: (r) => setEmployees(r.data?.data ?? []),
    });
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/fixed-allowances`,
      showToast: false,
      thenFn: (r) => setFixedAllowances((r.data?.data ?? r.data ?? []).filter((a: FixedAllowance) => a.isEnabled)),
    });
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/deductions`,
      showToast: false,
      thenFn: (r) => setDeductionTypes((r.data?.data ?? r.data ?? []).filter((d: DeductionType) => d.isEnabled)),
    });
  }, []);

  const selectedEmp = employees.find(e => e._id === employeeId);
  const gross = selectedEmp?.grossPay ?? 0;
  const empJobGroupId = selectedEmp?.jobGroupId ?? null;

  // Filter fixed allowances to those that apply to this employee's job group
  const applicableFixedAllowances = fixedAllowances.filter(a => {
    const ids = a.jobGroupIds ?? [];
    return ids.length === 0 || (empJobGroupId && ids.includes(empJobGroupId));
  });

  const fixedAllowancesTotal = applicableFixedAllowances.reduce((s, a) => s + (a.amount || 0), 0);
  const extraAllowances = allowances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const totalAllowances = fixedAllowancesTotal + extraAllowances;
  const totalEarnings = gross + totalAllowances;

  const paye  = totalEarnings > 0 ? calcPAYE(totalEarnings) : 0;
  const sha   = totalEarnings > 0 ? calcSHA(totalEarnings)  : 0;
  const nssf  = totalEarnings > 0 ? calcNSSF(totalEarnings) : 0;

  // Auto-deductions from configured deduction types matching this employee's job group
  const autoDeductionItems = deductionTypes
    .filter(d => {
      const ids = d.jobGroupIds ?? [];
      return ids.length === 0 || (empJobGroupId && ids.includes(empJobGroupId));
    })
    .map(d => ({
      name: d.name,
      amount: d.type === 'percentage'
        ? Math.round(totalEarnings * ((d.percentage || 0) / 100) * 100) / 100
        : (d.amount || 0),
    }));
  const autoDeductionsTotal = autoDeductionItems.reduce((s, d) => s + d.amount, 0);
  const extra = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netPay = Math.max(0, totalEarnings - paye - sha - nssf - autoDeductionsTotal - extra);

  // Block future months
  const now = new Date();
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFuture) return;
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/payroll`,
      method: 'POST',
      data: {
        employeeId,
        month,
        year,
        otherDeductions: deductions.filter(d => d.label && d.amount).map(d => ({ label: d.label, amount: Number(d.amount) })),
        otherAllowances: allowances.filter(a => a.label && a.amount).map(a => ({ label: a.label, amount: Number(a.amount) })),
      },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSubmitting(false),
    });
  };

  const addDeduction = () => setDeductions(d => [...d, { label: '', amount: '' }]);
  const updateDeduction = (i: number, field: keyof LineItem, val: string) =>
    setDeductions(d => { const n = [...d]; n[i] = { ...n[i], [field]: val }; return n; });
  const removeDeduction = (i: number) => setDeductions(d => d.filter((_, idx) => idx !== i));

  const addAllowance = () => setAllowances(a => [...a, { label: '', amount: '' }]);
  const updateAllowance = (i: number, field: keyof LineItem, val: string) =>
    setAllowances(a => { const n = [...a]; n[i] = { ...n[i], [field]: val }; return n; });
  const removeAllowance = (i: number) => setAllowances(a => a.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-primary">Generate Payroll</h2>
            <p className="text-xs text-foreground/50">Gross pay is pulled from the employee's profile</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <form id="gen-payroll-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Employee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Employee <span className="text-danger">*</span></label>
            <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              className="appearance-none h-10 w-full border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
              <option value="">Select employee…</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} — {emp.designation} ({emp.staffNumber}){emp.grossPay ? ` · KES ${emp.grossPay.toLocaleString()}` : ' · No gross pay set'}
                </option>
              ))}
            </select>
          </div>

          {/* Gross pay pulled from profile */}
          {selectedEmp && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${gross > 0 ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-amber-50 border border-amber-100 text-amber-700'}`}>
              <Info className="h-4 w-4 shrink-0" />
              {gross > 0
                ? <>Gross pay: <strong>KES {gross.toLocaleString()}</strong> — pulled from employee profile</>
                : <>No gross pay on this employee's profile. Update it before generating payroll.</>}
            </div>
          )}

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="appearance-none h-10 w-full border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Year</label>
              <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {isFuture && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <Info className="h-4 w-4 shrink-0" />
              Cannot generate payroll for a future period.
            </div>
          )}

          {/* Live breakdown preview */}
          {gross > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2 text-sm">
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide mb-3">Estimated breakdown</p>
              <div className="flex justify-between"><span className="text-foreground/60">Gross Pay</span><span className="font-semibold">{fmtCurrency(gross)}</span></div>

              {/* Fixed allowances applicable to this employee's job group */}
              {applicableFixedAllowances.map((a) => (
                <div key={a._id} className="flex justify-between text-emerald-600">
                  <span>{a.name}</span><span>+ {fmtCurrency(a.amount)}</span>
                </div>
              ))}
              {extraAllowances > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Other allowances</span><span>+ {fmtCurrency(extraAllowances)}</span></div>
              )}
              {totalAllowances > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium border-t border-primary/10 pt-1">
                  <span>Total Earnings</span><span>{fmtCurrency(totalEarnings)}</span>
                </div>
              )}

              <div className="h-px bg-primary/10 my-1" />
              <div className="flex justify-between text-red-600"><span>PAYE</span><span>− {fmtCurrency(paye)}</span></div>
              <div className="flex justify-between text-orange-600"><span>SHA (2.75%)</span><span>− {fmtCurrency(sha)}</span></div>
              <div className="flex justify-between text-amber-600"><span>NSSF</span><span>− {fmtCurrency(nssf)}</span></div>
              {/* Auto-deductions from configured deduction types */}
              {autoDeductionItems.map((d, i) => (
                <div key={i} className="flex justify-between text-purple-600">
                  <span>{d.name}</span><span>− {fmtCurrency(d.amount)}</span>
                </div>
              ))}
              {extra > 0 && <div className="flex justify-between text-purple-600"><span>Other deductions</span><span>− {fmtCurrency(extra)}</span></div>}
              <div className="h-px bg-primary/10 my-1" />
              <div className="flex justify-between text-emerald-700 font-bold text-base">
                <span>Est. Net Pay</span><span>{fmtCurrency(netPay)}</span>
              </div>
            </div>
          )}

          {/* Other Allowances */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Other Allowances</label>
              <button type="button" onClick={addAllowance}
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {allowances.map((a, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input type="text" placeholder="e.g. Housing allowance" value={a.label}
                  onChange={e => updateAllowance(i, 'label', e.target.value)}
                  className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <CurrencyInput value={a.amount} onChange={v => updateAllowance(i, 'amount', v)} placeholder="Amount" className="w-36 h-9" />
                <button type="button" onClick={() => removeAllowance(i)} className="text-danger/60 hover:text-danger transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Other Deductions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Other Deductions</label>
              <button type="button" onClick={addDeduction}
                className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {deductions.map((d, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input type="text" placeholder="e.g. SACCO loan" value={d.label}
                  onChange={e => updateDeduction(i, 'label', e.target.value)}
                  className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <CurrencyInput value={d.amount} onChange={v => updateDeduction(i, 'amount', v)} placeholder="Amount" className="w-36 h-9" />
                <button type="button" onClick={() => removeDeduction(i)} className="text-danger/60 hover:text-danger transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="gen-payroll-form" variant="accent" disabled={submitting || !employeeId || !gross || isFuture}>
            {submitting ? 'Generating…' : 'Generate Payroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}
