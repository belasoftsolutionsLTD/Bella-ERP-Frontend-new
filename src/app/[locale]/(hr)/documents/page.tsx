import { setRequestLocale } from 'next-intl/server';
import DocumentsPage from '@/features/documents/Pages/DocumentsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <DocumentsPage />;
}
