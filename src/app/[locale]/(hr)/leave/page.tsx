import { setRequestLocale } from 'next-intl/server';
import LeavePage from '@/features/leave/Pages/LeavePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <LeavePage />;
}
