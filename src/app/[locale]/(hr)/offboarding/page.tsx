import { setRequestLocale } from 'next-intl/server';
import OffboardingPage from '@/features/offboarding/Pages/OffboardingPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <OffboardingPage />;
}
