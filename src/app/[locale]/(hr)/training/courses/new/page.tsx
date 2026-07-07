import { setRequestLocale } from 'next-intl/server';
import { CourseBuilderPage } from '@/features/training/Pages/CourseBuilderPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <CourseBuilderPage locale={locale} />
    </div>
  );
}
