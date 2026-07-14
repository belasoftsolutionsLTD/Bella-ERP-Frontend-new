import { setRequestLocale } from 'next-intl/server';
import AccrualPoliciesPage from '@/features/leave/Pages/AccrualPoliciesPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <AccrualPoliciesPage />
    </div>
  );
}
