import { setRequestLocale } from 'next-intl/server';
import OrgChartPage from '@/features/orgChart/Pages/OrgChartPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <OrgChartPage />;
}
