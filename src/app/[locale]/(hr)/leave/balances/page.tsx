import { setRequestLocale } from 'next-intl/server';
import LeaveBalancesPage from '@/features/leave/Pages/LeaveBalancesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveBalancesPage />
    </div>
  );
}
