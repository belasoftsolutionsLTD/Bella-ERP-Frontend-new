import { setRequestLocale } from 'next-intl/server';
import LeaveAnalyticsPage from '@/features/leave/Pages/LeaveAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveAnalyticsPage />
    </div>
  );
}
