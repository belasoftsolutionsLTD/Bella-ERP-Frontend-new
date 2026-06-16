'use client';
import { useTranslations } from 'next-intl';
import { TrendingDown } from 'lucide-react';

export function PerformanceAlertList({ alerts }: { alerts: any[] }) {
  const t = useTranslations('Performance');
  if (alerts.length === 0) return <p className="text-sm text-foreground/50">No performance alerts.</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg border border-danger/30 bg-danger/5">
          <TrendingDown className="h-5 w-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-medium">{a.employee?.fullName}</p>
            <p className="text-xs text-foreground/60">{t('lowRating')}: {(a.ratings || []).join(', ')}/5</p>
          </div>
        </div>
      ))}
    </div>
  );
}
