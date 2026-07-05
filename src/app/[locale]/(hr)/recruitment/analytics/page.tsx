import { setRequestLocale } from 'next-intl/server';
import { AnalyticsPage } from '@/features/recruitment/Pages/AnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AnalyticsPage />;
}
