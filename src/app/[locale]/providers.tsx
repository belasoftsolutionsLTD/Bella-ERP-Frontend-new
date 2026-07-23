'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeLoader } from '@/components/ThemeLoader';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export default function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeLoader />
      <AuthProvider>{children}</AuthProvider>
    </NextIntlClientProvider>
  );
}
