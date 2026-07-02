import { setRequestLocale } from 'next-intl/server';
import PayrollEmployeesPage from '@/features/payroll/Pages/PayrollEmployeesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollEmployeesPage />;
}
