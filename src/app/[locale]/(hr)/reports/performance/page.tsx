import { setRequestLocale } from 'next-intl/server';
import PerformanceReportsPage from '@/features/reports/Pages/PerformanceReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PerformanceReportsPage />;
}
