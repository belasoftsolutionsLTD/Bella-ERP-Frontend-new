'use client';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export function ConflictAlert({ conflicts }: { conflicts: unknown[] }) {
  const t = useTranslations('Leave');
  if (conflicts.length === 0) return <p className="text-sm text-foreground/50">{t('noConflicts')}</p>;
  return (
    <div className="space-y-2">
      {(conflicts as any[]).map((c, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg border border-warning/50 bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-medium">{c.employee?.fullName}</p>
            <p className="text-xs text-foreground/60">{c.startDate} → {c.endDate} ({c.leaveType})</p>
          </div>
        </div>
      ))}
    </div>
  );
}
