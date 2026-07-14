import { setRequestLocale } from 'next-intl/server';
import LeaveReportsPage from '@/features/reports/Pages/LeaveReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LeaveReportsPage />;
}
