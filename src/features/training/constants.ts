import type { CourseCategory, CourseStatus, DifficultyLevel, ModuleType, EnrollmentStatus, ExternalCertStatus } from './types';
import type { Status } from '@/components/ui/StatusBadge';

export const CATEGORY_OPTIONS: CourseCategory[] = ['Compliance', 'Onboarding', 'Leadership', 'Technical', 'Soft Skills'];
export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

export const COURSE_STATUS_MAP: Record<CourseStatus, Status> = {
  draft: 'draft', published: 'active', archived: 'archived',
};

export const MODULE_TYPE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'text', label: 'Text' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'scorm', label: 'SCORM' },
  { value: 'link', label: 'Link' },
];

export const ENROLLMENT_STATUS_MAP: Record<EnrollmentStatus, Status> = {
  notStarted: 'draft', inProgress: 'inProgress', completed: 'completed', overdue: 'overdue', waived: 'inactive',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  waived: 'Waived',
};

export const EXTERNAL_CERT_STATUS_MAP: Record<ExternalCertStatus, Status> = {
  pending: 'pending', verified: 'verified', rejected: 'rejected',
};

export const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
