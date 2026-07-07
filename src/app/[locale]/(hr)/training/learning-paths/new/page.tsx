import { setRequestLocale } from 'next-intl/server';
import { LearningPathBuilderPage } from '@/features/training/Pages/LearningPathBuilderPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LearningPathBuilderPage locale={locale} />
    </div>
  );
}
