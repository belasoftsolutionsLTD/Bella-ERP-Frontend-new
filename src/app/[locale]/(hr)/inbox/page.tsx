import { setRequestLocale } from 'next-intl/server';
import InboxPage from '@/features/inbox/Pages/InboxPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <InboxPage />;
}
