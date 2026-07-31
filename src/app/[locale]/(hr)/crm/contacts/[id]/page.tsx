import { setRequestLocale } from 'next-intl/server';
import { ContactDetailPage } from '@/features/crm/Pages/ContactDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <ContactDetailPage id={id} />;
}
