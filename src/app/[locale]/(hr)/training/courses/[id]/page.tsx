import { setRequestLocale } from 'next-intl/server';
import { CourseDetailAdminPage } from '@/features/training/Pages/CourseDetailAdminPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <CourseDetailAdminPage id={id} locale={locale} />;
}
