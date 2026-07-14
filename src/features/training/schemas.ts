import { z } from 'zod';

// Note: the backend (CommonJS/Express) validates the same rules independently via
// validateRequiredFields + explicit business checks in trainingFunctions.js — there is
// no shared runtime between the TS frontend and CJS backend, so these Zod schemas are
// the single source of truth for client-side (RHF) validation only.

export const CreateCourseSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  coverImageUrl: z.string().optional(),
  category: z.enum(['Compliance', 'Onboarding', 'Leadership', 'Technical', 'Soft Skills']),
  tags: z.array(z.string()).default([]),
  skillsTaught: z.array(z.string()).default([]),
  estimatedDurationMinutes: z.coerce.number().int().min(1, 'Duration is required'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  isMandatory: z.boolean().default(false),
  targetRoles: z.array(z.string()).default([]),
  targetDepartments: z.array(z.string()).default([]),
  hasCertificate: z.boolean().default(false),
  certificateValidityDays: z.coerce.number().int().min(1).optional().nullable(),
  deliveryMethod: z.enum(['self_paced', 'instructor_led']).default('self_paced'),
});
export type CreateCourseFormValues = z.infer<typeof CreateCourseSchema>;

export const CreateSessionSchema = z.object({
  title: z.string().optional(),
  facilitatorId: z.string().optional(),
  facilitatorName: z.string().optional(),
  scheduledAt: z.string().min(1, 'Date/time is required'),
  durationMinutes: z.coerce.number().int().min(1, 'Duration is required'),
  meetingLink: z.string().min(1, 'Meeting link is required'),
  capacity: z.coerce.number().int().min(1).optional().nullable(),
});
export type CreateSessionFormValues = z.infer<typeof CreateSessionSchema>;
export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseFormValues = z.infer<typeof UpdateCourseSchema>;

export const CreateModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  order: z.coerce.number().int().min(0),
  type: z.enum(['video', 'document', 'text', 'quiz', 'scorm', 'link']),
  content: z.record(z.string(), z.any()).default({}),
  isRequired: z.boolean().default(true),
  minimumPassScore: z.coerce.number().int().min(0).max(100).optional(),
});
export type CreateModuleFormValues = z.infer<typeof CreateModuleSchema>;

export const quizQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['multipleChoice', 'trueFalse', 'shortAnswer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  points: z.coerce.number().min(1).default(1),
});

export const CreateQuizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, 'Add at least one question'),
  passingScore: z.coerce.number().int().min(1).max(100),
  maxAttempts: z.coerce.number().int().min(1).default(3),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  timeLimitMinutes: z.coerce.number().int().min(1).optional(),
});
export type CreateQuizFormValues = z.infer<typeof CreateQuizSchema>;

export const learningPathCourseRefSchema = z.object({
  courseId: z.string().min(1),
  order: z.coerce.number().int().min(0),
  isRequired: z.boolean().default(true),
  unlockAfterCourseId: z.string().optional(),
});

export const CreateLearningPathSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  courses: z.array(learningPathCourseRefSchema).min(1, 'Add at least one course'),
  targetRoles: z.array(z.string()).default([]),
  targetDepartments: z.array(z.string()).default([]),
  enrollmentTrigger: z.enum(['manual', 'onHire', 'onRoleChange', 'onPerformanceReview', 'scheduled']),
  dueDateOffsetDays: z.coerce.number().int().min(0).optional(),
});
export type CreateLearningPathFormValues = z.infer<typeof CreateLearningPathSchema>;
export const UpdateLearningPathSchema = CreateLearningPathSchema.partial();
export type UpdateLearningPathFormValues = z.infer<typeof UpdateLearningPathSchema>;

export const EnrollEmployeeSchema = z.object({
  employeeIds: z.array(z.string()).min(1, 'Select at least one employee'),
  courseId: z.string().optional(),
  learningPathId: z.string().optional(),
  dueDate: z.string().optional(),
}).refine((v) => !!v.courseId || !!v.learningPathId, { message: 'Select a course or a learning path', path: ['courseId'] });
export type EnrollEmployeeFormValues = z.infer<typeof EnrollEmployeeSchema>;

export const ProgressUpdateSchema = z.object({
  moduleId: z.string().min(1),
  status: z.enum(['notStarted', 'inProgress', 'completed']),
});
export type ProgressUpdateFormValues = z.infer<typeof ProgressUpdateSchema>;

export const SubmitQuizAttemptSchema = z.object({
  moduleId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string(), answer: z.union([z.string(), z.array(z.string())]) })),
});
export type SubmitQuizAttemptFormValues = z.infer<typeof SubmitQuizAttemptSchema>;

export const CreateAssignmentRuleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  trigger: z.enum(['onHire', 'onRoleChange', 'onDepartmentChange', 'onPerformanceScore', 'onCertExpiry', 'scheduled']),
  triggerConditions: z.object({
    roles: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    performanceScoreBelow: z.coerce.number().optional(),
    skillGaps: z.array(z.string()).optional(),
    daysBeforeCertExpiry: z.coerce.number().int().optional(),
    scheduledRecurrence: z.enum(['monthly', 'quarterly', 'annual', 'custom']).optional(),
    customIntervalDays: z.coerce.number().int().min(1).optional(),
  }).default({}),
  action: z.object({
    enrollInCourseIds: z.array(z.string()).default([]),
    enrollInLearningPathIds: z.array(z.string()).default([]),
    dueDateOffsetDays: z.coerce.number().int().min(0).optional(),
    notifyEmployee: z.boolean().default(true),
    notifyManager: z.boolean().default(false),
  }),
  isActive: z.boolean().default(true),
});
export type CreateAssignmentRuleFormValues = z.infer<typeof CreateAssignmentRuleSchema>;

export const UploadExternalCertSchema = z.object({
  name: z.string().min(2, 'Certificate name is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  issuedDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
  fileUrl: z.string().min(1, 'File is required'),
  verificationUrl: z.string().url().optional().or(z.literal('')),
});
export type UploadExternalCertFormValues = z.infer<typeof UploadExternalCertSchema>;

export const CourseFeedbackSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  review: z.string().optional(),
});
export type CourseFeedbackFormValues = z.infer<typeof CourseFeedbackSchema>;
