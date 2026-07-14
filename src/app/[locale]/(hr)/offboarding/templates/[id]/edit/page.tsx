import { setRequestLocale } from 'next-intl/server';
import TemplateBuilderPage from '@/features/offboarding/Pages/TemplateBuilderPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <TemplateBuilderPage templateId={id} />
    </div>
  );
}
