import { setRequestLocale } from 'next-intl/server';
import CustomReportBuilderPage from '@/features/reports/Pages/CustomReportBuilderPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CustomReportBuilderPage />;
}
