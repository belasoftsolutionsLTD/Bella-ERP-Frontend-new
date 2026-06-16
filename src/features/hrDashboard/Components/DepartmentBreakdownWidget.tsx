'use client';
import { useTranslations } from 'next-intl';

const BAR_COLORS = [
  'bg-primary',
  'bg-blue-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-violet-400',
  'bg-cyan-400',
  'bg-orange-400',
];

export function DepartmentBreakdownWidget({ data }: { data: { department: string; count: number }[] }) {
  const t = useTranslations('HrDashboard');
  const max = Math.max(...data.map((d) => d.count), 1);

  // Y-axis grid lines (0, 25%, 50%, 75%, 100% of max)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * max));

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold mb-5">{t('byDepartment')}</h3>

      <div className="flex gap-4">
        {/* Y-axis labels */}
        <div className="flex flex-col-reverse justify-between text-xs text-foreground/40 shrink-0 pb-7" style={{ height: 160 }}>
          {gridLines.map(v => <span key={v} className="leading-none">{v}</span>)}
        </div>

        {/* Chart area */}
        <div className="flex-1 min-w-0 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 pb-7 flex flex-col-reverse justify-between pointer-events-none" style={{ height: 160 }}>
            {gridLines.map(v => (
              <div key={v} className="w-full border-t border-dashed border-gray-100" />
            ))}
          </div>

          {/* Bars */}
          <div className="flex items-end gap-1.5 pb-7" style={{ height: 160 }}>
            {data.map((d, i) => {
              const pct = (d.count / max) * 100;
              return (
                <div key={d.department} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
                  {/* Count label on hover */}
                  <span className="text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${d.department}: ${d.count}`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis department labels */}
          <div className="flex gap-1.5">
            {data.map((d) => (
              <div key={d.department} className="flex-1 min-w-0 text-center">
                <span className="text-[9px] text-foreground/50 leading-tight line-clamp-2 block">
                  {d.department}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 pt-3 border-t">
          {data.map((d, i) => (
            <div key={d.department} className="flex items-center gap-1.5 text-xs text-foreground/60">
              <span className={`h-2 w-2 rounded-sm shrink-0 ${BAR_COLORS[i % BAR_COLORS.length]}`} />
              <span className="truncate max-w-[120px]">{d.department}</span>
              <span className="font-semibold text-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
