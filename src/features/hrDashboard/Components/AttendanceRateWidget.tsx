'use client';
import { useTranslations } from 'next-intl';
import { CheckSquare } from 'lucide-react';

export function AttendanceRateWidget({ rate }: { rate: number }) {
  const t = useTranslations('HrDashboard');
  const color = rate >= 80 ? 'text-success' : rate >= 60 ? 'text-warning' : 'text-danger';
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4">
      <div className="rounded-full bg-success/10 p-3">
        <CheckSquare className="h-6 w-6 text-success" />
      </div>
      <div>
        <p className={`text-3xl font-bold ${color}`}>{rate}%</p>
        <p className="text-sm text-foreground/60">{t('attendanceRate')}</p>
      </div>
    </div>
  );
}
