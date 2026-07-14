import { setRequestLocale } from 'next-intl/server';
import WorkforceAnalyticsPage from '@/features/employees/Pages/WorkforceAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <WorkforceAnalyticsPage />
    </div>
  );
}
