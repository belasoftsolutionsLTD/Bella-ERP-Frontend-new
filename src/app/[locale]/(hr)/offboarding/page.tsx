import { setRequestLocale } from 'next-intl/server';
import OffboardingDashboardPage from '@/features/offboarding/Pages/OffboardingDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <OffboardingDashboardPage />
    </div>
  );
}
