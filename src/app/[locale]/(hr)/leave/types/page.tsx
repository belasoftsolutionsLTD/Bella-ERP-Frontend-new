import { setRequestLocale } from 'next-intl/server';
import LeaveTypesPage from '@/features/leave/Pages/LeaveTypesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <LeaveTypesPage />
    </div>
  );
}
