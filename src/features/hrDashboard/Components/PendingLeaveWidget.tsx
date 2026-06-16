'use client';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';

export function PendingLeaveWidget({ count }: { count: number }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4">
      <div className="rounded-full bg-warning/20 p-3">
        <Calendar className="h-6 w-6 text-warning" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{count}</p>
        <p className="text-sm text-foreground/60">{t('pendingLeave')}</p>
      </div>
    </div>
  );
}
