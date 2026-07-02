import { setRequestLocale } from 'next-intl/server';
import PayrollConceptsPage from '@/features/payroll/Pages/PayrollConceptsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollConceptsPage />;
}
