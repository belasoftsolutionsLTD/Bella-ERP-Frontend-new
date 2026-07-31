import { setRequestLocale } from 'next-intl/server';
import { PurchaseOrderDetailPage } from '@/features/inventory/Pages/PurchaseOrderDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <PurchaseOrderDetailPage id={id} />;
}
