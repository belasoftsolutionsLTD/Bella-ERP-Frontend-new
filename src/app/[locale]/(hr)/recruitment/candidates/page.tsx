import { setRequestLocale } from 'next-intl/server';
import { CandidatesPage } from '@/features/recruitment/Pages/CandidatesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <CandidatesPage locale={locale} />;
}
