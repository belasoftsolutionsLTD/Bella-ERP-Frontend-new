'use client';
import { TaskItem } from './TaskItem';
import type { OnboardingTask } from '../Hooks/useOnboarding';

interface Props {
  tasks: OnboardingTask[];
  onComplete?: (id: string) => void;
  onUpdated?: () => void;
  onDeleted?: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onUpdated, onDeleted }: Props) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskItem key={t._id} task={t} onComplete={onComplete} onUpdated={onUpdated} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
