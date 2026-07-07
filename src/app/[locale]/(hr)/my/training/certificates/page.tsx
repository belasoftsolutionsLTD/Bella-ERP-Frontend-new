import { setRequestLocale } from 'next-intl/server';
import { MyCertificatesPage } from '@/features/training/Pages/MyCertificatesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <MyCertificatesPage />;
}
