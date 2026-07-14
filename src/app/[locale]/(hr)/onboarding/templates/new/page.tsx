import { setRequestLocale } from 'next-intl/server';
import TemplateBuilderPage from '@/features/onboarding/Pages/TemplateBuilderPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <TemplateBuilderPage />
    </div>
  );
}
