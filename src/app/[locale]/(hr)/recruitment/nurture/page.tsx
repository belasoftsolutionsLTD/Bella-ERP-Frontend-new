import { setRequestLocale } from 'next-intl/server';
import { NurturePage } from '@/features/recruitment/Pages/NurturePage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <NurturePage locale={locale} />;
}
