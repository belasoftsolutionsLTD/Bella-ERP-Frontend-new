import { setRequestLocale } from 'next-intl/server';
import { RequisitionsListPage } from '@/features/recruitment/Pages/RequisitionsListPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <RequisitionsListPage locale={locale} />;
}
