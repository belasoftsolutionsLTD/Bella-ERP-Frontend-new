import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School ERP',
  description: 'School ERP / LMS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
