import { setRequestLocale } from 'next-intl/server';
import DemoPipelinePage from '@/features/recruitment/Pages/DemoPipelinePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <DemoPipelinePage locale={locale} />;
}
