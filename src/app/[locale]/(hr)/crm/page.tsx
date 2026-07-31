import { setRequestLocale } from 'next-intl/server';
import { CRMPage } from '@/features/crm/Pages/CRMPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CRMPage />;
}
