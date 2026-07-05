import { setRequestLocale } from 'next-intl/server';
import { CandidateProfilePage } from '@/features/recruitment/Pages/CandidateProfilePage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <CandidateProfilePage id={id} locale={locale} />;
}
