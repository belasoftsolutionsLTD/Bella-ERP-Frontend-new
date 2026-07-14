import { setRequestLocale } from 'next-intl/server';
import OffboardingAnalyticsPage from '@/features/offboarding/Pages/OffboardingAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <OffboardingAnalyticsPage />
    </div>
  );
}
