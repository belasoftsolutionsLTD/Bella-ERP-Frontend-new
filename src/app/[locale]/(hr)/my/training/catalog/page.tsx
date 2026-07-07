import { setRequestLocale } from 'next-intl/server';
import { MyCatalogPage } from '@/features/training/Pages/MyCatalogPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <MyCatalogPage locale={locale} />;
}
