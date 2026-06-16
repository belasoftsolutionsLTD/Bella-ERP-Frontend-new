import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'sw', 'fr', 'pt', 'es', 'de', 'ha', 'so'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
