import { setRequestLocale } from 'next-intl/server';
import { LogisticsPage } from '@/features/logistics/Pages/LogisticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LogisticsPage />;
}
