'use client';
import { useTranslations } from 'next-intl';
import { PayrollRow } from './PayrollRow';
import type { PayrollSummary } from '../Hooks/usePayroll';

interface Props {
  records: PayrollSummary[];
  employeeId?: string;
  onRefetch?: () => void;
}

export function PayrollTable({ records, employeeId, onRefetch }: Props) {
  const t = useTranslations('Payroll');
  const tc = useTranslations('Common');
  const showEmployee = !employeeId;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 border-b">
            <tr>
              {showEmployee && <th className="px-4 py-3 text-left font-semibold text-foreground/70">Employee</th>}
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">{t('month')}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">{t('grossPay')}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">Allowances</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">{t('deductions')}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">{t('netPay')}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">Payment</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground/70">{tc('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={showEmployee ? 8 : 7} className="text-center py-10 text-foreground/40">
                  {t('noPayroll')}
                </td>
              </tr>
            ) : records.map((r) => (
              <PayrollRow key={r._id} record={r} showEmployee={showEmployee} onRefetch={onRefetch} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
