import { setRequestLocale } from 'next-intl/server';
import RecruitmentReportsPage from '@/features/reports/Pages/RecruitmentReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <RecruitmentReportsPage />;
}
