import { setRequestLocale } from 'next-intl/server';
import PayrollPage from '@/features/payroll/Pages/PayrollPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollPage />;
}
