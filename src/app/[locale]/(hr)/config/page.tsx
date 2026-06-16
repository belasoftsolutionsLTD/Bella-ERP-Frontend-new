import { setRequestLocale } from 'next-intl/server';
import HrConfigPage from '@/features/config/Pages/HrConfigPage';

export default async function ConfigPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <HrConfigPage />;
}
