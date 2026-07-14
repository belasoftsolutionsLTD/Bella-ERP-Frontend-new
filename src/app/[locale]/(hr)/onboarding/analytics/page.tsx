import { setRequestLocale } from 'next-intl/server';
import OnboardingAnalyticsPage from '@/features/onboarding/Pages/OnboardingAnalyticsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <OnboardingAnalyticsPage />
    </div>
  );
}
