'use client';
import { useState } from 'react';
import { Briefcase, DollarSign, CalendarDays, CreditCard, Pencil, X, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useHrConfig } from '@/features/config/Hooks/useHrConfig';
import type { Employee } from '../Hooks/useEmployees';

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
  </div>
);

function SectionHeader({ icon: Icon, title, onEdit, editing }: {
  icon: React.ElementType; title: string; onEdit?: () => void; editing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {onEdit && !editing && (
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      )}
    </div>
  );
}

const inp = 'w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-colors';
const sel = `${inp} appearance-none`;

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mpesa',         label: 'M-Pesa'        },
  { value: 'cash',          label: 'Cash'           },
  { value: 'paypal',        label: 'PayPal'         },
  { value: 'crypto',        label: 'Crypto'         },
];

export function WorkTab({ employee }: { employee: Employee }) {
  const hireDate    = employee.dateOfHire      ? new Date(employee.dateOfHire).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : null;
  const contractEnd = employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : null;

  const emp = employee as any;
  const { jobGroups } = useHrConfig();

  // ── Compensation edit state ──────────────────────────────────────────────────
  const [editComp, setEditComp] = useState(false);
  const [grossPay, setGrossPay] = useState(String(emp.grossPay ?? ''));
  const [kraPin,   setKraPin]   = useState(emp.kraPin   ?? '');
  const [jobGroupId, setJobGroupId] = useState(emp.jobGroupId ?? '');
  const [savingComp, setSavingComp] = useState(false);

  const saveComp = () => {
    setSavingComp(true);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${emp._id}`,
      method: 'PUT',
      data: { ...emp, grossPay: grossPay ? Number(grossPay) : null, kraPin, jobGroupId: jobGroupId || null },
      thenFn: () => { setEditComp(false); },
      finallyFn: () => setSavingComp(false),
    });
  };

  // ── Payment edit state ───────────────────────────────────────────────────────
  const [editPay, setEditPay]     = useState(false);
  const [method,  setMethod]      = useState(emp.paymentMethod   ?? 'bank_transfer');
  const [bankName, setBankName]   = useState(emp.bankName        ?? '');
  const [bankAcct, setBankAcct]   = useState(emp.bankAccountNumber ?? '');
  const [mpesa,   setMpesa]       = useState(emp.mpesaNumber     ?? '');
  const [paypal,  setPaypal]      = useState(emp.paypalEmail     ?? '');
  const [crypto,  setCrypto]      = useState(emp.cryptoWalletAddress ?? '');
  const [savingPay, setSavingPay] = useState(false);

  const savePay = () => {
    setSavingPay(true);
    apiCallFunction({
      url: `${API_BASE_URL}/employees/${emp._id}`,
      method: 'PUT',
      data: { ...emp, paymentMethod: method, bankName, bankAccountNumber: bankAcct, mpesaNumber: mpesa, paypalEmail: paypal, cryptoWalletAddress: crypto },
      thenFn: () => { setEditPay(false); },
      finallyFn: () => setSavingPay(false),
    });
  };

  return (
    <div className="space-y-5">
      {/* Position */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={Briefcase} title="Position" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Designation"     value={emp.designation} />
          <Field label="Department"      value={emp.department} />
          <Field label="Employment Type" value={emp.employmentType} />
          <Field label="Staff Category"  value={emp.staffCategory} />
          <Field label="Staff Number"    value={emp.staffNumber} />
        </div>
      </div>

      {/* Contract Dates */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={CalendarDays} title="Contract" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Date of Hire"      value={hireDate} />
          <Field label="Contract End Date" value={contractEnd ?? 'Permanent'} />
        </div>
      </div>

      {/* Compensation */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={DollarSign} title="Compensation" onEdit={() => setEditComp(true)} editing={editComp} />
        {editComp ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Gross Monthly Pay (KES)</label>
                <input type="number" value={grossPay} onChange={e => setGrossPay(e.target.value)} placeholder="e.g. 85000" className={inp} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tax ID / PIN</label>
                <input type="text" value={kraPin} onChange={e => setKraPin(e.target.value)} placeholder="e.g. A000123456X" className={inp} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Job Group</label>
                {jobGroups.items.length > 0 ? (
                  <select value={jobGroupId} onChange={e => setJobGroupId(e.target.value)} className={sel}>
                    <option value="">— Select job group —</option>
                    {jobGroups.items.map((g: any) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={jobGroupId} onChange={e => setJobGroupId(e.target.value)} placeholder="Job Group ID" className={inp} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={saveComp} disabled={savingComp} className="flex items-center gap-1.5 h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60">
                {savingComp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingComp ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditComp(false)} className="flex items-center gap-1 h-8 px-3 text-xs text-slate-500 hover:text-slate-700 border border-gray-200 rounded-lg">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Gross Monthly Pay" value={emp.grossPay ? `KES ${Number(emp.grossPay).toLocaleString()}` : null} />
            <Field label="Salary Grade"      value={emp.salaryGrade} />
            <Field label="Tax ID / PIN"           value={emp.kraPin} />
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <SectionHeader icon={CreditCard} title="Payment Method" onEdit={() => setEditPay(true)} editing={editPay} />
        {editPay ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Payment Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} className={sel}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {method === 'bank_transfer' && (<>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Bank Name</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Equity Bank" className={inp} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Account Number</label>
                  <input type="text" value={bankAcct} onChange={e => setBankAcct(e.target.value)} placeholder="e.g. 0123456789" className={inp} />
                </div>
              </>)}
              {method === 'mpesa' && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">M-Pesa Number</label>
                  <input type="text" value={mpesa} onChange={e => setMpesa(e.target.value)} placeholder="+254 7XX XXX XXX" className={inp} />
                </div>
              )}
              {method === 'paypal' && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">PayPal Email</label>
                  <input type="email" value={paypal} onChange={e => setPaypal(e.target.value)} placeholder="email@paypal.com" className={inp} />
                </div>
              )}
              {method === 'crypto' && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Wallet Address</label>
                  <input type="text" value={crypto} onChange={e => setCrypto(e.target.value)} placeholder="0x..." className={inp} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={savePay} disabled={savingPay} className="flex items-center gap-1.5 h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60">
                {savingPay ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingPay ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditPay(false)} className="flex items-center gap-1 h-8 px-3 text-xs text-slate-500 hover:text-slate-700 border border-gray-200 rounded-lg">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={cn('grid gap-4', emp.paymentMethod ? 'grid-cols-2 md:grid-cols-3' : '')}>
            {emp.paymentMethod ? (<>
              <Field label="Method"         value={emp.paymentMethod?.replace(/_/g, ' ')} />
              {emp.paymentMethod === 'bank_transfer' && (<>
                <Field label="Bank Name"       value={emp.bankName} />
                <Field label="Account Number"  value={emp.bankAccountNumber} />
              </>)}
              {emp.paymentMethod === 'mpesa'  && <Field label="M-Pesa Number" value={emp.mpesaNumber} />}
              {emp.paymentMethod === 'paypal' && <Field label="PayPal Email"  value={emp.paypalEmail} />}
              {emp.paymentMethod === 'crypto' && <Field label="Wallet Address" value={emp.cryptoWalletAddress} />}
            </>) : (
              <p className="text-sm text-slate-400 italic">No payment method on file. Click Edit to add one.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
