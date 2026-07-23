import { setRequestLocale } from 'next-intl/server';
import WelfareSchemesPage from '@/features/welfare/Pages/WelfareSchemesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <WelfareSchemesPage />;
}
