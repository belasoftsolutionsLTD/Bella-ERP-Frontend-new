import { setRequestLocale } from 'next-intl/server';
import HrDashboardPage from '@/features/hrDashboard/Pages/HrDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <HrDashboardPage />;
}
