import { setRequestLocale } from 'next-intl/server';
import { CourseBuilderPage } from '@/features/training/Pages/CourseBuilderPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <CourseBuilderPage locale={locale} courseId={id} />
    </div>
  );
}
