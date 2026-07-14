'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveCalendar } from '../Hooks/useLeaveCalendar';
import { usePublicHolidays } from '../Hooks/usePublicHolidays';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LeaveCalendarPage() {
  const locale = useLocale();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const { entries, loading } = useLeaveCalendar({ startDate: monthStart.toISOString().slice(0, 10), endDate: monthEnd.toISOString().slice(0, 10) });
  const { holidays } = usePublicHolidays(year);

  const days = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const entriesForDay = (day: Date) => entries.filter(e => new Date(e.startDate) <= day && new Date(e.endDate) >= day);
  const holidayForDay = (day: Date) => holidays.find(h => h.date === day.toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Leave
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Team Calendar</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Who's on leave, month by month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-brand-text w-36 text-center">{monthStart.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" /></div>
      ) : (
        <div className="bg-brand-bg-soft border border-brand-border/60 rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS.map(w => <div key={w} className="text-center text-[11px] font-semibold text-brand-text-muted uppercase py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              if (!day) return <div key={i} className="min-h-24" />;
              const dayEntries = entriesForDay(day);
              const holiday = holidayForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={cn('min-h-24 rounded-lg border p-1.5 flex flex-col gap-1', isToday ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border/60')}>
                  <span className={cn('text-[11px] font-semibold', isToday ? 'text-indigo-400' : 'text-brand-text-muted')}>{day.getDate()}</span>
                  {holiday && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-300 truncate">{holiday.name}</span>}
                  {dayEntries.slice(0, 3).map(e => (
                    <span key={e._id} className="text-[9px] px-1 py-0.5 rounded truncate" style={{ backgroundColor: `${e.leaveType?.color}22`, color: e.leaveType?.color }}>
                      {e.employee?.fullName?.split(' ')[0]}
                    </span>
                  ))}
                  {dayEntries.length > 3 && <span className="text-[9px] text-brand-text-muted">+{dayEntries.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
