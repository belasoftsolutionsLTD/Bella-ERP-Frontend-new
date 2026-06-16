'use client';
import { useTranslations } from 'next-intl';
import { TaskList } from '../../onboarding/Components/TaskList';
import type { OnboardingTask } from '../../onboarding/Hooks/useOnboarding';

export function MyTasksTab({ tasks }: { tasks: OnboardingTask[] }) {
  const t = useTranslations('StaffPortal');
  if (tasks.length === 0) return <p className="text-sm text-foreground/50">{t('noTasks')}</p>;
  return <TaskList tasks={tasks} />;
}
