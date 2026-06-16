import { setRequestLocale } from 'next-intl/server';
import AttendancePage from '@/features/attendance/Pages/AttendancePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AttendancePage />;
}
