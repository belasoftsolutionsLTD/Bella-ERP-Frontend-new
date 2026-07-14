import { setRequestLocale } from 'next-intl/server';
import InsightsPage from '@/features/reports/Pages/InsightsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <InsightsPage />;
}
