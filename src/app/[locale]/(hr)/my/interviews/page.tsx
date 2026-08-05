import { setRequestLocale } from 'next-intl/server';
import MyInterviewsPage from '@/features/recruitment/Pages/MyInterviewsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <div className="p-6">
      <MyInterviewsPage />
    </div>
  );
}
