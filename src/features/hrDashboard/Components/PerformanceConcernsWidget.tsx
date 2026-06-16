'use client';
import { useTranslations } from 'next-intl';
import { TrendingDown } from 'lucide-react';

export function PerformanceConcernsWidget({ concerns }: { concerns: any[] }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-5 w-5 text-danger" />
        <h3 className="font-semibold">{t('performanceConcerns')}</h3>
      </div>
      {concerns.length === 0 ? (
        <p className="text-sm text-foreground/50">No performance concerns.</p>
      ) : (
        <ul className="space-y-2">
          {concerns.slice(0, 5).map((c, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger" />
              <span>{c.employee?.fullName ?? 'Employee'}</span>
              <span className="ml-auto text-danger text-xs">Ratings: {(c.ratings || []).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
