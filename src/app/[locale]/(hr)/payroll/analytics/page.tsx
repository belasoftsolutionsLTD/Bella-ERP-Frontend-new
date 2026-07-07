import { setRequestLocale } from 'next-intl/server';
import PayrollAnalyticsPage from '@/features/payroll/Pages/PayrollAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollAnalyticsPage />;
}
