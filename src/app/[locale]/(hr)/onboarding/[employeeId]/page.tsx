import { setRequestLocale } from 'next-intl/server';
import OnboardingChecklistPage from '@/features/onboarding/Pages/OnboardingChecklistPage';

export default function Page({
  params: { locale, employeeId },
}: {
  params: { locale: string; employeeId: string };
}) {
  setRequestLocale(locale);
  return <OnboardingChecklistPage employeeId={employeeId} />;
}
