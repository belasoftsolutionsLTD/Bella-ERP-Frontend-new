import { setRequestLocale } from 'next-intl/server';
import StaffPortalPage from '@/features/staffPortal/Pages/StaffPortalPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <StaffPortalPage />;
}
