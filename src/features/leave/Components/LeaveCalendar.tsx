'use client';
import { useTranslations } from 'next-intl';

export function LeaveCalendar({ data }: { data: Record<string, unknown[]> }) {
  const t = useTranslations('Leave');
  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold mb-4">{t('calendar')}</h3>
      {Object.keys(data).length === 0 ? (
        <p className="text-sm text-foreground/50">No approved leave this period.</p>
      ) : Object.entries(data).map(([dept, entries]) => (
        <div key={dept} className="mb-4">
          <h4 className="text-sm font-semibold text-primary mb-2">{dept}</h4>
          <div className="space-y-1">
            {(entries as any[]).map((e, i) => (
              <div key={i} className="flex gap-3 text-sm p-2 rounded bg-accent/10">
                <span className="font-medium">{e.employee?.fullName}</span>
                <span className="text-foreground/50">{e.startDate} → {e.endDate}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 rounded capitalize">{e.leaveType}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
