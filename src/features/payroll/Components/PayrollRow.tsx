'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { DeductionsModal } from './DeductionsModal';
import { AllowancesModal } from './AllowancesModal';
import { PayslipDownloadButton } from './PayslipDownloadButton';
import { DisbursePaymentModal } from './DisbursePaymentModal';
import type { PayrollSummary } from '../Hooks/usePayroll';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props { record: PayrollSummary; showEmployee?: boolean; onRefetch?: () => void }

export function PayrollRow({ record, showEmployee, onRefetch }: Props) {
  const t = useTranslations('Payroll');
  const [showDeductions, setShowDeductions] = useState(false);
  const [showAllowances, setShowAllowances] = useState(false);
  const [showDisburse, setShowDisburse] = useState(false);
  const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE')}`;
  const isPaid = record.paymentStatus === 'paid';

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-gray-50 text-sm">
        {showEmployee && (
          <td className="px-4 py-3">
            {record.employee ? (
              <div>
                <p className="font-medium text-foreground">{record.employee.fullName}</p>
                <p className="text-xs text-foreground/40">{record.employee.staffNumber} · {record.employee.department}</p>
              </div>
            ) : (
              <span className="text-foreground/30 text-xs font-mono">{String(record.employeeId).slice(-8)}</span>
            )}
          </td>
        )}
        <td className="px-4 py-3">{MONTHS[record.month - 1]} {record.year}</td>
        <td className="px-4 py-3 font-medium">{fmt(record.grossPay)}</td>
        <td className="px-4 py-3">
          <button
            onClick={() => setShowAllowances(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Allowances
          </button>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setShowDeductions(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-danger border border-red-200 hover:bg-red-100 transition-colors"
          >
            {t('deductions')}
          </button>
        </td>
        <td className="px-4 py-3 font-semibold text-success">{fmt(record.netPay)}</td>

        {/* Payment status */}
        <td className="px-4 py-3">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> Paid
            </span>
          ) : (
            <button
              onClick={() => setShowDisburse(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay Now
            </button>
          )}
        </td>

        <td className="px-4 py-3">
          <PayslipDownloadButton employeeId={String(record.employeeId)} month={record.month} year={record.year} />
        </td>
      </tr>

      {showDeductions && <DeductionsModal record={record} onClose={() => setShowDeductions(false)} />}
      {showAllowances && <AllowancesModal record={record} onClose={() => setShowAllowances(false)} />}
      {showDisburse && (
        <DisbursePaymentModal
          record={record}
          onClose={() => setShowDisburse(false)}
          onSuccess={() => { setShowDisburse(false); onRefetch?.(); }}
        />
      )}
    </>
  );
}
