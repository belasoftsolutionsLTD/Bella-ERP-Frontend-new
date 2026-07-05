import { setRequestLocale } from 'next-intl/server';
import { RecruitmentSettingsPage } from '@/features/recruitment/Pages/RecruitmentSettingsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <RecruitmentSettingsPage />;
}
