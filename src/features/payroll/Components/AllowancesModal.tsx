'use client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayrollSummary } from '../Hooks/usePayroll';

export function AllowancesModal({ record, onClose }: { record: PayrollSummary; onClose: () => void }) {
  const fmt = (n: number) => `KES ${(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const hasAllowances = (record.allowances?.length ?? 0) > 0 || (record.otherAllowances?.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Allowances</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">Gross Pay</span>
            <span className="font-medium">{fmt(record.grossPay)}</span>
          </div>

          {hasAllowances ? (
            <div className="border-t pt-2 space-y-1">
              {record.allowances?.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span>{a.name}</span>
                  <span className="text-emerald-600">+ {fmt(a.amount)}</span>
                </div>
              ))}
              {record.otherAllowances?.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span>{a.label}</span>
                  <span className="text-emerald-600">+ {fmt(a.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-t pt-2 text-foreground/40 text-xs">No allowances applied to this payroll record.</div>
          )}

          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Earnings</span>
            <span className="text-emerald-700">{fmt(record.totalEarnings ?? record.grossPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
