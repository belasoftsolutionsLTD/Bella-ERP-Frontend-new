import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bella ERP',
  description: 'Bella ERP – HR Management System',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as 'en' | 'sw')) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <Providers locale={locale} messages={messages}>
      <div>{children}</div>
    </Providers>
  );
}
