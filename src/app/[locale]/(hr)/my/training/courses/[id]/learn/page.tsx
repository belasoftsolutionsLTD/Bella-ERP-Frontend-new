import { setRequestLocale } from 'next-intl/server';
import { MyCourseLearnerPage } from '@/features/training/Pages/MyCourseLearnerPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <MyCourseLearnerPage locale={locale} courseId={id} />;
}
