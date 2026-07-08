import { setRequestLocale } from 'next-intl/server';
import PayrollSettingsPage from '@/features/payroll/Pages/PayrollSettingsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PayrollSettingsPage />;
}
