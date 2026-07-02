import { setRequestLocale } from 'next-intl/server';
import ExpensesPage from '@/features/expenses/Pages/ExpensesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <ExpensesPage />;
}
