'use client';
import { useTranslations } from 'next-intl';
import { ClipboardList } from 'lucide-react';

interface OEntry { employeeId: string; total: number; completed: number; percentage: number }

export function OnboardingProgressWidget({ entries }: { entries: OEntry[] }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t('onboardingProgress')}</h3>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-foreground/50">No active onboarding.</p>
      ) : (
        <ul className="space-y-3">
          {entries.slice(0, 5).map((e) => (
            <li key={String(e.employeeId)}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground/70">{String(e.employeeId).slice(-6)}</span>
                <span className="font-medium">{e.percentage}% {t('complete')}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${e.percentage}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
