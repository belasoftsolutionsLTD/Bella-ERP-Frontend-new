import { setRequestLocale } from 'next-intl/server';
import { AssignmentCenterPage } from '@/features/training/Pages/AssignmentCenterPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <AssignmentCenterPage />;
}
