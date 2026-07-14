import { setRequestLocale } from 'next-intl/server';
import OnboardingDashboardPage from '@/features/onboarding/Pages/OnboardingDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <OnboardingDashboardPage />
    </div>
  );
}
