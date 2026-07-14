import { setRequestLocale } from 'next-intl/server';
import MyLeaveRequestDetailPage from '@/features/leave/Pages/MyLeaveRequestDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyLeaveRequestDetailPage locale={locale} requestId={id} />
    </div>
  );
}
