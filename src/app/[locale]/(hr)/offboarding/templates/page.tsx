import { setRequestLocale } from 'next-intl/server';
import TemplatesListPage from '@/features/offboarding/Pages/TemplatesListPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <TemplatesListPage />
    </div>
  );
}
