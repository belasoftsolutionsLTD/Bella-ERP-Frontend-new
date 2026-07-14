import { setRequestLocale } from 'next-intl/server';
import SpendReportsPage from '@/features/reports/Pages/SpendReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <SpendReportsPage />;
}
