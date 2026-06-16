'use client';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayrollSummary } from '../Hooks/usePayroll';

export function DeductionsModal({ record, onClose }: { record: PayrollSummary; onClose: () => void }) {
  const t = useTranslations('Payroll');
  const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">{t('deductions')}</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>{t('grossPay')}</span><span className="font-medium">{fmt(record.grossPay)}</span></div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between"><span>{t('paye')}</span><span className="text-danger">-{fmt(record.deductions.paye)}</span></div>
            <div className="flex justify-between"><span>{t('sha')}</span><span className="text-danger">-{fmt(record.deductions.sha)}</span></div>
            <div className="flex justify-between"><span>{t('nssf')}</span><span className="text-danger">-{fmt(record.deductions.nssf)}</span></div>
            {record.deductions.otherDeductions?.map((od, i) => (
              <div key={i} className="flex justify-between"><span>{od.label}</span><span className="text-danger">-{fmt(od.amount)}</span></div>
            ))}
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>{t('netPay')}</span><span className="text-success">{fmt(record.netPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
