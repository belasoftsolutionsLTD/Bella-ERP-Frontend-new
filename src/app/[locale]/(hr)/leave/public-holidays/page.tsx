import { setRequestLocale } from 'next-intl/server';
import PublicHolidaysPage from '@/features/leave/Pages/PublicHolidaysPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <PublicHolidaysPage />
    </div>
  );
}
