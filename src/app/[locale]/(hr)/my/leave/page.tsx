import { setRequestLocale } from 'next-intl/server';
import MyLeaveDashboardPage from '@/features/leave/Pages/MyLeaveDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyLeaveDashboardPage />
    </div>
  );
}
