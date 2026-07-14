import { setRequestLocale } from 'next-intl/server';
import ExecutiveDashboardPage from '@/features/reports/Pages/ExecutiveDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <ExecutiveDashboardPage />;
}
