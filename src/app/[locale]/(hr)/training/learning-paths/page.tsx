import { setRequestLocale } from 'next-intl/server';
import { LearningPathsListPage } from '@/features/training/Pages/LearningPathsListPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LearningPathsListPage locale={locale} />;
}
