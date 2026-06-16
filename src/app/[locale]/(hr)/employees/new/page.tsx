import { setRequestLocale } from 'next-intl/server';
import EmployeeCreatePage from '@/features/employees/Pages/EmployeeCreatePage';

export default function Page({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <EmployeeCreatePage />;
}
