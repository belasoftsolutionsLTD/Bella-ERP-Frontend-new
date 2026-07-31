import { setRequestLocale } from 'next-intl/server';
import { InventoryPage } from '@/features/inventory/Pages/InventoryPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <InventoryPage />;
}
