'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyLeaveCalendar } from '../Hooks/useMyLeave';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MyLeaveCalendarPage({ locale }: { locale: string }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const { mine, team, holidays, loading } = useMyLeaveCalendar();

  const entries = useMemo(() => [
    ...mine.map(e => ({ ...e, mine: true })),
    ...team.map(e => ({ ...e, mine: false })),
  ], [mine, team]);

  const days = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const entriesForDay = (day: Date) => entries.filter(e => new Date(e.startDate) <= day && new Date(e.endDate) >= day);
  const holidayForDay = (day: Date) => holidays.find((h: any) => h.date === day.toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/${locale}/my/leave`} className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text mb-1.5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> My Leave
          </Link>
          <h1 className="text-xl font-semibold text-brand-text">My Calendar</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">Your leave, team leave, and public holidays</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-brand-text w-36 text-center">{monthStart.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="h-9 w-9 flex items-center justify-center border border-brand-border bg-brand-bg-soft rounded-lg text-brand-text-secondary hover:text-brand-text transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS.map(w => <div key={w} className="text-center text-[11px] font-semibold text-brand-text-secondary uppercase py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              if (!day) return <div key={i} className="min-h-24" />;
              const dayEntries = entriesForDay(day);
              const holiday = holidayForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={cn('min-h-24 rounded-lg border p-1.5 flex flex-col gap-1', isToday ? 'border-primary bg-primary/5' : 'border-slate-100')}>
                  <span className={cn('text-[11px] font-semibold', isToday ? 'text-primary' : 'text-brand-text-secondary')}>{day.getDate()}</span>
                  {holiday && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 truncate">{holiday.name}</span>}
                  {dayEntries.slice(0, 3).map(e => (
                    <span key={e._id} className={cn('text-[9px] px-1 py-0.5 rounded truncate', e.mine && 'font-bold')} style={{ backgroundColor: `${e.leaveType?.color}22`, color: e.leaveType?.color }}>
                      {e.mine ? 'You' : e.employee?.fullName?.split(' ')[0]}
                    </span>
                  ))}
                  {dayEntries.length > 3 && <span className="text-[9px] text-brand-text-secondary">+{dayEntries.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
