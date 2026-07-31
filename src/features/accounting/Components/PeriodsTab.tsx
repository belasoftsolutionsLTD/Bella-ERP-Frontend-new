'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Unlock } from 'lucide-react';
import { useAccountingPeriods } from '../Hooks/useAccountingConfig';
import type { AccountingAccessLevel } from '../types';

export function PeriodsTab({ level }: { level: AccountingAccessLevel }) {
  const t = useTranslations('Accounting');
  const { periods, closePeriod, reopenPeriod } = useAccountingPeriods();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const canManage = level === 'admin';

  const statusFor = (y: number, m: number) => periods.find((p) => p.year === y && p.month === m)?.status ?? 'open';

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-24 border border-slate-200 rounded-lg px-2 text-sm" />
          {statusFor(year, month) === 'open' ? (
            <button onClick={() => closePeriod(year, month)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-700 text-white text-sm font-semibold"><Lock className="h-3.5 w-3.5" /> {t('periods.close')}</button>
          ) : (
            <button onClick={() => reopenPeriod(year, month)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold"><Unlock className="h-3.5 w-3.5" /> {t('periods.reopen')}</button>
          )}
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {periods.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('periods.noneClosedYet')}</p>
        ) : periods.map((p) => (
          <div key={p._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-slate-700">{p.month}/{p.year}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${p.status === 'closed' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{t(`periods.${p.status}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
