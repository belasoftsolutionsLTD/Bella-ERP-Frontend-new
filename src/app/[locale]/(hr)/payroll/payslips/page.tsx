import { setRequestLocale } from 'next-intl/server';
import PayrollPayslipsPage from '@/features/payroll/Pages/PayrollPayslipsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollPayslipsPage />;
}
