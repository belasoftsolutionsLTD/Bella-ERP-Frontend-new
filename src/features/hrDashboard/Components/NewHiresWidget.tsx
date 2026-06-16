'use client';
import { useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';

export function NewHiresWidget({ hires }: { hires: any[] }) {
  const t = useTranslations('HrDashboard');
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t('newHires')}</h3>
      </div>
      {hires.length === 0 ? (
        <p className="text-sm text-foreground/50">No new hires this month.</p>
      ) : (
        <ul className="space-y-2">
          {hires.slice(0, 5).map((h, i) => (
            <li key={i} className="text-sm flex justify-between">
              <span>{h.fullName}</span>
              <span className="text-foreground/50 text-xs">{h.designation}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
