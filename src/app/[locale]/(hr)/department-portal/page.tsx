import { setRequestLocale } from 'next-intl/server';
import DepartmentPortalPage from '@/features/departmentPortal/Pages/DepartmentPortalPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <DepartmentPortalPage />;
}
