import { setRequestLocale } from 'next-intl/server';
import EmployeeDetailPage from '@/features/employees/Pages/EmployeeDetailPage';

export default function Page({ params }: { params: { locale: string; id: string } }) {
  setRequestLocale(params.locale);
  return <EmployeeDetailPage id={params.id} />;
}
