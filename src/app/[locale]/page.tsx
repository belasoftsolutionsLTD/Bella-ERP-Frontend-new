import { redirect } from 'next/navigation';

export default function LocaleHomePage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/login`);
}
