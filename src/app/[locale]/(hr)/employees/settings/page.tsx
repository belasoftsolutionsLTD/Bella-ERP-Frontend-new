import { setRequestLocale } from 'next-intl/server';
import PeopleSettingsPage from '@/features/employees/Pages/PeopleSettingsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <PeopleSettingsPage />;
}
