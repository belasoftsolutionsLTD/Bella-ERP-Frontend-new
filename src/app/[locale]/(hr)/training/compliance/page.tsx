import { setRequestLocale } from 'next-intl/server';
import { ComplianceDashboardPage } from '@/features/training/Pages/ComplianceDashboardPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <ComplianceDashboardPage />;
}
