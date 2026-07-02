import { setRequestLocale } from 'next-intl/server';
import FinancialWorkspacePage from '@/features/finance/Pages/FinancialWorkspacePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <FinancialWorkspacePage />;
}
