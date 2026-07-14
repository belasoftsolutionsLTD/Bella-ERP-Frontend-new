import { setRequestLocale } from 'next-intl/server';
import RequestDetailPage from '@/features/leave/Pages/RequestDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <RequestDetailPage requestId={id} />
    </div>
  );
}
