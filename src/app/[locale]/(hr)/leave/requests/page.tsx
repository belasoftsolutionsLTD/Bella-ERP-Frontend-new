import { setRequestLocale } from 'next-intl/server';
import LeaveRequestsPage from '@/features/leave/Pages/LeaveRequestsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveRequestsPage />
    </div>
  );
}
