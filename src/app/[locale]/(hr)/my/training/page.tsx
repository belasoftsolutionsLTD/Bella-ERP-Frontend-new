import { setRequestLocale } from 'next-intl/server';
import { MyLearningDashboardPage } from '@/features/training/Pages/MyLearningDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <MyLearningDashboardPage locale={locale} />;
}
