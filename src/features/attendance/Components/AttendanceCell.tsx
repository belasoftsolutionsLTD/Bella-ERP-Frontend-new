'use client';
import { cn } from '@/lib/utils';

const COLORS: Record<string, string> = {
  present:  'bg-success/20 text-success',
  absent:   'bg-danger/20 text-danger',
  late:     'bg-warning/20 text-yellow-700',
  half_day: 'bg-blue-100 text-blue-700',
  remote:   'bg-purple-100 text-purple-700',
};
const LABELS: Record<string, string> = { present: 'P', absent: 'A', late: 'L', half_day: 'H', remote: 'R' };

export function AttendanceCell({ status, offsite }: { status?: string; offsite?: boolean }) {
  if (!status) return <div className="w-8 h-8 rounded bg-gray-50 border" />;
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
