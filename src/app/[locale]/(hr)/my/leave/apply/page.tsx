import { setRequestLocale } from 'next-intl/server';
import ApplyLeavePage from '@/features/leave/Pages/ApplyLeavePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <ApplyLeavePage locale={locale} />
    </div>
  );
}
