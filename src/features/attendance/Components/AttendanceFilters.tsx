'use client';
import { useTranslations } from 'next-intl';

interface Filters { month?: number; year?: number; department?: string }
interface Props { filters: Filters; onChange: (f: Filters) => void }

const DEPARTMENTS = ['Lower Primary','Upper Primary','Junior Secondary','Senior Secondary','Administration','Finance','ICT','Library','Games and Sports','Guidance and Counselling'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function AttendanceFilters({ filters, onChange }: Props) {
  const t = useTranslations('Attendance');
  const tc = useTranslations('Common');
  const now = new Date();
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select value={filters.month ?? now.getMonth() + 1} onChange={(e) => onChange({ ...filters, month: Number(e.target.value) })}
        className="h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select value={filters.year ?? now.getFullYear()} onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
        className="h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={filters.department ?? ''} onChange={(e) => onChange({ ...filters, department: e.target.value || undefined })}
        className="h-10 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">{tc('department')}</option>
        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
}
