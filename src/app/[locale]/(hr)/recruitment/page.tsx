import { setRequestLocale } from 'next-intl/server';
import RecruitmentPage from '@/features/recruitment/Pages/RecruitmentPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <RecruitmentPage />;
}
