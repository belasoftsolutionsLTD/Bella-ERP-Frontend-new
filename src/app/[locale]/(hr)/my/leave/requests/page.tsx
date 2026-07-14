import { setRequestLocale } from 'next-intl/server';
import MyLeaveRequestsPage from '@/features/leave/Pages/MyLeaveRequestsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyLeaveRequestsPage locale={locale} />
    </div>
  );
}
