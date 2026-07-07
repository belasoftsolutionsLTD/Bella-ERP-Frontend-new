import type { CourseCategory, CourseStatus, DifficultyLevel, ModuleType, EnrollmentStatus, ExternalCertStatus } from './types';

export const CATEGORY_OPTIONS: CourseCategory[] = ['Compliance', 'Onboarding', 'Leadership', 'Technical', 'Soft Skills'];
export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

export const COURSE_STATUS_STYLES: Record<CourseStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const MODULE_TYPE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'text', label: 'Text' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'scorm', label: 'SCORM' },
  { value: 'link', label: 'Link' },
];

export const ENROLLMENT_STATUS_STYLES: Record<EnrollmentStatus, string> = {
  notStarted: 'bg-slate-100 text-slate-600 border-slate-200',
  inProgress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  waived: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  waived: 'Waived',
};

export const EXTERNAL_CERT_STATUS_STYLES: Record<ExternalCertStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
