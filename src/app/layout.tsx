import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bela ERP',
  description: 'Bela ERP – HR Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
