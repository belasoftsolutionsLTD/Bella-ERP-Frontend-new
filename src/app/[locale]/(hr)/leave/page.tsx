import { setRequestLocale } from 'next-intl/server';
import LeaveDashboardPage from '@/features/leave/Pages/LeaveDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveDashboardPage />
    </div>
  );
}
