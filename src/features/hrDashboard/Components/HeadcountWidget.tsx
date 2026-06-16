'use client';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

export function HeadcountWidget({ total, teaching, nonTeaching }: { total: number; teaching: number; nonTeaching: number }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl bg-primary p-5 text-white">
      <div className="flex items-center gap-3 mb-3">
        <Users className="h-6 w-6 text-accent" />
        <span className="text-sm font-medium opacity-80">{t('totalHeadcount')}</span>
      </div>
      <p className="text-4xl font-bold">{total}</p>
      <div className="mt-3 flex gap-4 text-xs opacity-80">
        <span>{t('teaching')}: {teaching}</span>
        <span>{t('nonTeaching')}: {nonTeaching}</span>
      </div>
    </div>
  );
}
