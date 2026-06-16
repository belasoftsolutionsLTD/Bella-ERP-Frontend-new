'use client';

import { useEffect, useState } from 'react';
import { X, Building2, Smartphone, Banknote, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import type { PayrollSummary } from '../Hooks/usePayroll';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CompanyAccount {
  _id: string;
  name: string;
  accountType: 'bank' | 'mpesa' | 'cash';
  bankName?: string;
  accountNumber?: string;
  mpesaNumber?: string;
}

interface Props {
  record: PayrollSummary;
  onClose: () => void;
  onSuccess: () => void;
}

function fmt(n: number) { return `KES ${(n || 0).toLocaleString('en-KE')}`; }

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  bank:  <Building2 className="h-4 w-4" />,
  mpesa: <Smartphone className="h-4 w-4" />,
  cash:  <Banknote className="h-4 w-4" />,
};

export function DisbursePaymentModal({ record, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/company-accounts`,
      showToast: false,
      thenFn: (res) => setAccounts(res.data?.data ?? res.data ?? []),
    });
  }, []);

  const selectedAccount = accounts.find(a => a._id === selectedAccountId);
  const emp = record.employee;
  const period = `${MONTHS[record.month - 1]} ${record.year}`;

  const handleDisburse = () => {
    setSubmitting(true);
    setStep(3);
    apiCallFunction({
      url: `${API_BASE_URL}/payroll/${record._id}/disburse`,
      method: 'POST',
      data: { companyAccountId: selectedAccountId },
      thenFn: () => {
        setTimeout(() => { onSuccess(); onClose(); }, 1800);
      },
      catchFn: () => {
        setStep(2);
        setSubmitting(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Step indicator */}
        <div className="flex items-center gap-0 bg-primary/5 border-b">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${step >= s ? 'text-primary' : 'text-foreground/30'}`}>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1.5 text-[10px] ${step > s ? 'bg-primary text-white' : step === s ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-foreground/30'}`}>
                {step > s ? '✓' : s}
              </span>
              {s === 1 ? 'Review' : s === 2 ? 'Pay From' : 'Confirm'}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 text-foreground/30 hover:text-foreground z-10">
          <X className="h-5 w-5" />
        </button>

        {/* ── Step 1: Review ────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Confirm Payment</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Review the payroll details before proceeding.</p>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/50">Employee</span>
                <span className="font-semibold">{emp?.fullName ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/50">Period</span>
                <span className="font-semibold">{period}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/50">Gross Pay</span>
                <span>{fmt(record.grossPay)}</span>
              </div>
              <div className="h-px bg-primary/10" />
              <div className="flex justify-between text-base font-bold text-success">
                <span>Net Pay (to disburse)</span>
                <span>{fmt(record.netPay)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose} className="text-sm text-foreground/40 hover:text-foreground px-4 py-2 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                Proceed to Payment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Select company account ───────────────────── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pay From</h2>
              <p className="text-sm text-foreground/50 mt-0.5">Select the company account to disburse {fmt(record.netPay)} from.</p>
            </div>

            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
                No company accounts set up yet. Go to <strong>HR Config → Company Accounts</strong> to add one.
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <button
                    key={acc._id}
                    onClick={() => setSelectedAccountId(acc._id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${selectedAccountId === acc._id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                  >
                    <span className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${selectedAccountId === acc._id ? 'bg-primary text-white' : 'bg-gray-100 text-foreground/50'}`}>
                      {ACCOUNT_ICONS[acc.accountType] ?? <Building2 className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{acc.name}</p>
                      <p className="text-xs text-foreground/40 capitalize">
                        {acc.accountType === 'bank' && acc.bankName ? `${acc.bankName} · ${acc.accountNumber || ''}` : acc.accountType}
                        {acc.accountType === 'mpesa' && acc.mpesaNumber ? acc.mpesaNumber : ''}
                      </p>
                    </div>
                    {selectedAccountId === acc._id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-1">
              <button onClick={() => setStep(1)} className="text-sm text-foreground/40 hover:text-foreground px-4 py-2 rounded-xl hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={handleDisburse}
                disabled={!selectedAccountId || submitting}
                className="flex items-center gap-2 bg-success text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-success/90 transition-colors disabled:opacity-40"
              >
                Disburse Payment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Processing / Success ─────────────────────── */}
        {step === 3 && (
          <div className="p-10 flex flex-col items-center gap-5 text-center">
            {submitting ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div>
                  <p className="font-bold text-lg">Processing Payment…</p>
                  <p className="text-sm text-foreground/50 mt-1">Disbursing {fmt(record.netPay)} to {emp?.fullName}</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-success" />
                </div>
                <div>
                  <p className="font-bold text-lg text-success">Payment Sent!</p>
                  <p className="text-sm text-foreground/50 mt-1">
                    {fmt(record.netPay)} disbursed to {emp?.fullName} for {period}
                  </p>
                  {selectedAccount && (
                    <p className="text-xs text-foreground/40 mt-1">From: {selectedAccount.name}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
