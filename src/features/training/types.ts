// Shared TypeScript interfaces for the training/LMS module (mirrors backend collection shapes).
// All ObjectId refs and Dates are serialized as strings over the wire.

export type CourseCategory = 'Compliance' | 'Onboarding' | 'Leadership' | 'Technical' | 'Soft Skills';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type ModuleType = 'video' | 'document' | 'text' | 'quiz' | 'scorm' | 'link';
export type QuestionType = 'multipleChoice' | 'trueFalse' | 'shortAnswer';
export type EnrollmentStatus = 'notStarted' | 'inProgress' | 'completed' | 'overdue' | 'waived';
export type ModuleProgressStatus = 'notStarted' | 'inProgress' | 'completed';
export type EnrollmentTrigger = 'manual' | 'onHire' | 'onRoleChange' | 'onPerformanceReview' | 'scheduled';
export type PathStatus = 'active' | 'archived';
export type RuleTrigger = 'onHire' | 'onRoleChange' | 'onDepartmentChange' | 'onPerformanceScore' | 'onCertExpiry' | 'scheduled';
export type ScheduledRecurrence = 'monthly' | 'quarterly' | 'annual';
export type ExternalCertStatus = 'pending' | 'verified' | 'rejected';

export interface Course {
  _id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  category: CourseCategory;
  tags: string[];
  skillsTaught: string[];
  estimatedDurationMinutes: number;
  difficultyLevel: DifficultyLevel;
  status: CourseStatus;
  isMandatory: boolean;
  targetRoles: string[];
  targetDepartments: string[];
  hasCertificate: boolean;
  certificateValidityDays?: number | null;
  createdBy: string;
  authors: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // populated on list/detail endpoints
  enrolledCount?: number;
  completionRate?: number;
  avgRating?: number;
}

export interface ModuleContent {
  // video
  url?: string;
  durationMinutes?: number;
  // document
  fileUrl?: string;
  fileName?: string;
  // text
  markdown?: string;
  // link
  linkUrl?: string;
  linkDescription?: string;
  // scorm
  packageUrl?: string;
  [key: string]: unknown;
}

export interface CourseModule {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  type: ModuleType;
  content: ModuleContent;
  isRequired: boolean;
  minimumPassScore?: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Quiz {
  _id: string;
  moduleId: string;
  courseId: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitMinutes?: number;
}

// Quiz shape delivered to a learner — correctAnswer/explanation stripped until after submission.
export interface QuizForLearner {
  _id: string;
  moduleId: string;
  courseId: string;
  questions: Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[];
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes?: number;
}

export interface LearningPathCourseRef {
  courseId: string;
  order: number;
  isRequired: boolean;
  unlockAfterCourseId?: string;
}

export interface LearningPath {
  _id: string;
  name: string;
  description: string;
  courses: LearningPathCourseRef[];
  targetRoles: string[];
  targetDepartments: string[];
  enrollmentTrigger: EnrollmentTrigger;
  dueDateOffsetDays?: number;
  status: PathStatus;
  createdBy: string;
  createdAt: string;
  // populated
  enrolledCount?: number;
}

export interface ModuleProgress {
  moduleId: string;
  status: ModuleProgressStatus;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  lastScore?: number;
}

export interface Enrollment {
  _id: string;
  employeeId: string;
  courseId?: string;
  learningPathId?: string;
  enrolledBy: string;
  enrollmentTrigger: string;
  dueDate?: string;
  status: EnrollmentStatus;
  completedAt?: string;
  progressPercentage: number;
  moduleProgress: ModuleProgress[];
  createdAt: string;
  updatedAt: string;
  // populated
  course?: Pick<Course, '_id' | 'title' | 'category' | 'isMandatory' | 'hasCertificate'>;
  employee?: { _id: string; fullName: string; department: string };
}

export interface Certificate {
  _id: string;
  employeeId: string;
  courseId: string;
  enrollmentId: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt?: string;
  pdfUrl?: string;
  // populated
  course?: Pick<Course, '_id' | 'title'>;
}

export interface ExternalCertificate {
  _id: string;
  employeeId: string;
  name: string;
  issuingOrganization: string;
  issuedDate: string;
  expiryDate?: string;
  fileUrl: string;
  verificationUrl?: string;
  status: ExternalCertStatus;
  verifiedBy?: string;
  uploadedAt: string;
}

export interface RuleTriggerConditions {
  roles?: string[];
  departments?: string[];
  performanceScoreBelow?: number;
  skillGaps?: string[];
  daysBeforeCertExpiry?: number;
  scheduledRecurrence?: ScheduledRecurrence;
}

export interface RuleAction {
  enrollInCourseIds?: string[];
  enrollInLearningPathIds?: string[];
  dueDateOffsetDays?: number;
  notifyEmployee: boolean;
  notifyManager: boolean;
}

export interface TrainingAssignmentRule {
  _id: string;
  name: string;
  trigger: RuleTrigger;
  triggerConditions: RuleTriggerConditions;
  action: RuleAction;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  // populated
  lastRunAt?: string;
  lastRunMatched?: number;
  lastRunCreated?: number;
}

export interface TrainingFeedback {
  _id: string;
  enrollmentId: string;
  courseId: string;
  employeeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
  submittedAt: string;
}

export interface QuizAttemptResult {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  yourAnswer: string | string[];
  correctAnswer?: string | string[];
  explanation?: string;
}

export interface QuizAttemptResponse {
  score: number;
  passed: boolean;
  attemptsRemaining: number;
  results: QuizAttemptResult[];
}
