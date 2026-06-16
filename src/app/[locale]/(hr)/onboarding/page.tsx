import { setRequestLocale } from 'next-intl/server';
import OnboardingPage from '@/features/onboarding/Pages/OnboardingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <OnboardingPage />;
}
