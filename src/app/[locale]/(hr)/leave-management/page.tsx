import { setRequestLocale } from 'next-intl/server';
import { LeaveManagementPage } from '@/features/leave/Pages/LeaveManagementPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LeaveManagementPage />;
}
