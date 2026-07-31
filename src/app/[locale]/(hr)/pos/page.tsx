import { setRequestLocale } from 'next-intl/server';
import { POSPage } from '@/features/pos/Pages/POSPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <POSPage />;
}
