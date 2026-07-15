import { setRequestLocale } from 'next-intl/server';
import LoansPage from '@/features/payroll/Pages/LoansPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LoansPage />;
}
