import { setRequestLocale } from 'next-intl/server';
import { AccountingPage } from '@/features/accounting/Pages/AccountingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AccountingPage />;
}
