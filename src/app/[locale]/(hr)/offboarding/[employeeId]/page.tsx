import { setRequestLocale } from 'next-intl/server';
import OffboardingChecklistPage from '@/features/offboarding/Pages/OffboardingChecklistPage';

export default function Page({
  params: { locale, employeeId },
}: {
  params: { locale: string; employeeId: string };
}) {
  setRequestLocale(locale);
  return <OffboardingChecklistPage employeeId={employeeId} />;
}
