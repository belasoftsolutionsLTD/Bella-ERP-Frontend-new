'use client';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export function AbsenceAlertList({ alerts }: { alerts: any[] }) {
  const t = useTranslations('Attendance');
  if (alerts.length === 0) return <p className="text-sm text-foreground/50">{t('noAlerts')}</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg border border-danger/30 bg-danger/5">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{a.employee?.fullName}</p>
            <p className="text-xs text-foreground/60">
              {a.consecutiveAbsentDays} {t('consecutiveAbsent')} · {a.from} to {a.to}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
