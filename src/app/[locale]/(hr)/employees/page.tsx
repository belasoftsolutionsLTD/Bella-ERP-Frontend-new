import { setRequestLocale } from 'next-intl/server';
import EmployeesPage from '@/features/employees/Pages/EmployeesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <EmployeesPage />;
}
