import { setRequestLocale } from 'next-intl/server';
import { TrainingAnalyticsPage } from '@/features/training/Pages/TrainingAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <TrainingAnalyticsPage />;
}
