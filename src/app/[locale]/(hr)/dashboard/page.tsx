import { setRequestLocale } from 'next-intl/server';
import DashboardPage from '@/features/dashboard/Pages/DashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <DashboardPage />;
}
