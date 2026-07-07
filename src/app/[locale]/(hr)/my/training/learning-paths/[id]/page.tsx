import { setRequestLocale } from 'next-intl/server';
import { MyLearningPathDetailPage } from '@/features/training/Pages/MyLearningPathDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <MyLearningPathDetailPage locale={locale} pathId={id} />;
}
