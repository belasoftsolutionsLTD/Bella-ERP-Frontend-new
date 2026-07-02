import { setRequestLocale } from 'next-intl/server';
import ProjectDetailPage from '@/features/projects/Pages/ProjectDetailPage';

export default function Page({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  setRequestLocale(locale);
  return <ProjectDetailPage projectId={id} />;
}
