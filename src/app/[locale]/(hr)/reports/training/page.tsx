import { setRequestLocale } from 'next-intl/server';
import TrainingReportsPage from '@/features/reports/Pages/TrainingReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <TrainingReportsPage />;
}
