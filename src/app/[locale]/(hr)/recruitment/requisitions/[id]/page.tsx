import { setRequestLocale } from 'next-intl/server';
import { RequisitionDetailPage } from '@/features/recruitment/Pages/RequisitionDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <RequisitionDetailPage id={id} locale={locale} />;
}
