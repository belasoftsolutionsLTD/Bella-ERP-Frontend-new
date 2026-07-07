import { setRequestLocale } from 'next-intl/server';
import { CoursesListPage } from '@/features/training/Pages/CoursesListPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CoursesListPage locale={locale} />;
}
