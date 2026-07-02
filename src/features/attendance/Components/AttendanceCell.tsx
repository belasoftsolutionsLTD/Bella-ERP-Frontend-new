'use client';
import { cn } from '@/lib/utils';

const COLORS: Record<string, string> = {
  present:    'bg-emerald-500/20 text-emerald-400',
  absent:     'bg-red-500/20 text-red-400',
  late:       'bg-amber-500/20 text-amber-400',
  incomplete: 'bg-orange-500/20 text-orange-400',
  half_day:   'bg-blue-500/20 text-blue-400',
  remote:     'bg-violet-500/20 text-violet-400',
};
const LABELS: Record<string, string> = { present: 'P', absent: 'A', late: 'L', incomplete: 'I', half_day: 'H', remote: 'R' };

export function AttendanceCell({ status, offsite }: { status?: string; offsite?: boolean }) {
  if (!status) return <div className="w-8 h-8 rounded border border-slate-700/50 bg-slate-800/30" />;
  return (
    <div className="relative inline-flex">
      <div className={cn('w-8 h-8 rounded flex items-center justify-center text-xs font-bold', COLORS[status] ?? 'bg-gray-100')}>
        {LABELS[status] ?? '?'}
      </div>
      {offsite && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 border border-white" title="Off-site" />
      )}
    </div>
  );
}
