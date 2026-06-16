import { setRequestLocale } from 'next-intl/server';
import PerformancePage from '@/features/performance/Pages/PerformancePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PerformancePage />;
}
