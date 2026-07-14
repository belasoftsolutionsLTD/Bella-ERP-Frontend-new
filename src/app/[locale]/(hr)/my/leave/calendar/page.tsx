import { setRequestLocale } from 'next-intl/server';
import MyLeaveCalendarPage from '@/features/leave/Pages/MyLeaveCalendarPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyLeaveCalendarPage locale={locale} />
    </div>
  );
}
