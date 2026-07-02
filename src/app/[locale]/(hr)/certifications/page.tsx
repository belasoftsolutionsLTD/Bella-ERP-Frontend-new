import { setRequestLocale } from 'next-intl/server';
import AwardsPage from '@/features/awards/Pages/AwardsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AwardsPage />;
}
