import { setRequestLocale } from 'next-intl/server';
import WorkforceReportsPage from '@/features/reports/Pages/WorkforceReportsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <WorkforceReportsPage />;
}
