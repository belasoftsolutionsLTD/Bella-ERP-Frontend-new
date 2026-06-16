'use client';
import { useTranslations } from 'next-intl';
import type { LeaveBalance } from '../Hooks/useLeave';

const LEAVE_TYPES = ['annual','sick','maternity','paternity','unpaid','emergency'];

export function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const t = useTranslations('Leave');
  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold mb-4">{t('balances')} ({balance.year})</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LEAVE_TYPES.map((type) => {
          const b = balance.balances[type];
          if (!b) return null;
          return (
            <div key={type} className="rounded-lg border p-3 text-center">
              <p className="text-xs font-medium text-foreground/60 capitalize mb-2">{(t as any)(type)}</p>
              <p className="text-2xl font-bold text-primary">{b.remaining ?? '∞'}</p>
              <p className="text-xs text-foreground/40">{b.used} {t('used')} / {b.allocated ?? '∞'} {t('allocated')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
