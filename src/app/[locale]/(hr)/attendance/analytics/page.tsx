import { setRequestLocale } from 'next-intl/server';
import AttendanceAnalyticsPage from '@/features/attendance/Pages/AttendanceAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AttendanceAnalyticsPage />;
}
