import { setRequestLocale } from 'next-intl/server';
import LeaveCalendarPage from '@/features/leave/Pages/LeaveCalendarPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveCalendarPage />
    </div>
  );
}
