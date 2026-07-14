import { setRequestLocale } from 'next-intl/server';
import AttendanceReportsPage from '@/features/reports/Pages/AttendanceReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AttendanceReportsPage />;
}
