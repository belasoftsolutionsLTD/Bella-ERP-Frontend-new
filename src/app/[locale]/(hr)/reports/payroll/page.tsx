import { setRequestLocale } from 'next-intl/server';
import PayrollReportsPage from '@/features/reports/Pages/PayrollReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollReportsPage />;
}
