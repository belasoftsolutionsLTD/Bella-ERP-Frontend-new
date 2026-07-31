import { setRequestLocale } from 'next-intl/server';
import { CompanyDetailPage } from '@/features/crm/Pages/CompanyDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <CompanyDetailPage id={id} />;
}
