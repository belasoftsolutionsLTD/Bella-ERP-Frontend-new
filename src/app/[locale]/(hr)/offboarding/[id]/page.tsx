import { setRequestLocale } from 'next-intl/server';
import RecordDetailPage from '@/features/offboarding/Pages/RecordDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <RecordDetailPage recordId={id} />
    </div>
  );
}
