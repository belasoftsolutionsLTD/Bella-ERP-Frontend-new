import { setRequestLocale } from 'next-intl/server';
import MyOnboardingPage from '@/features/onboarding/Pages/MyOnboardingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyOnboardingPage />
    </div>
  );
}
