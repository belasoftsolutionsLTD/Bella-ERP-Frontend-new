import { setRequestLocale } from 'next-intl/server';
import SecurityPage from '@/features/account/Pages/SecurityPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <SecurityPage />
    </div>
  );
}
