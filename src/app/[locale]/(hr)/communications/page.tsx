import { setRequestLocale } from 'next-intl/server';
import CommunicationPage from '@/features/communication/Pages/CommunicationPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CommunicationPage />;
}
