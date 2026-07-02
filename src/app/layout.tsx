import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bella ERP',
  description: 'Bella ERP – HR Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
