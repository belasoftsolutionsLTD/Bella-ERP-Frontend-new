import { setRequestLocale } from 'next-intl/server';
import ProjectsPage from '@/features/projects/Pages/ProjectsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <ProjectsPage />;
}
