import { setRequestLocale } from 'next-intl/server';
import CommunicationsPage from '@/features/announcements/Pages/CommunicationsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CommunicationsPage />;
}
