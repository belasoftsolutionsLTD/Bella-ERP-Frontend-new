import { setRequestLocale } from 'next-intl/server';
import { LearningPathBuilderPage } from '@/features/training/Pages/LearningPathBuilderPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LearningPathBuilderPage locale={locale} pathId={id} />
    </div>
  );
}
