import { setRequestLocale } from 'next-intl/server';
import SpendingPage from '@/features/spending/Pages/SpendingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <SpendingPage />;
}
