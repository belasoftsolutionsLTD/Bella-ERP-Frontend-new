import { setRequestLocale } from 'next-intl/server';
import MyOffboardingPage from '@/features/offboarding/Pages/MyOffboardingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyOffboardingPage />
    </div>
  );
}
