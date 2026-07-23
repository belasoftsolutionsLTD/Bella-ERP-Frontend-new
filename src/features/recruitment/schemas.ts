import { z } from 'zod';

// Note: the backend (CommonJS/Express) validates the same rules independently via
// validateRequiredFields + explicit business checks in recruitmentFunctions.js —
// there is no shared runtime between the TS frontend and CJS backend, so these
// Zod schemas are the single source of truth for client-side (RHF) validation only.

export const competencySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Competency name is required'),
  description: z.string().optional().default(''),
  weight: z.number().min(1).max(5),
});

export const autoActionSchema = z.object({
  trigger: z.enum(['onEnter', 'onExit']),
  action: z.enum(['notifyHiringManager', 'emailCandidate', 'autoReject']),
  templateId: z.string().optional(),
});

export const pipelineStageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Stage name is required'),
  type: z.enum(['sourcing', 'screening', 'interview', 'assessment', 'offer', 'hired']),
  requiresScorecard: z.boolean().default(false),
  scorecardTemplateId: z.string().optional(),
  autoActions: z.array(autoActionSchema).default([]),
});

export const approverSchema = z.object({
  approverId: z.string().min(1, 'Approver is required'),
  approverName: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  actedAt: z.string().optional(),
  comment: z.string().optional(),
});

export const screeningQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, 'Question text is required'),
  required: z.boolean().default(false),
});

export const CreateRequisitionSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['fullTime', 'partTime', 'contract', 'internship']),
  headcount: z.coerce.number().int().min(1, 'Headcount must be at least 1'),
  salaryRange: z.object({
    min: z.coerce.number().min(0),
    max: z.coerce.number().min(0),
    currency: z.string().min(1).default('KES'),
  }).refine((s) => s.max >= s.min, { message: 'Max salary must be >= min salary', path: ['max'] }),
  description: z.string().min(10, 'Description is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  competencies: z.array(competencySchema).default([]),
  pipelineStages: z.array(pipelineStageSchema).min(1, 'At least one pipeline stage is required'),
  screeningQuestions: z.array(screeningQuestionSchema).default([]),
  approvalChain: z.array(approverSchema).min(1, 'Add at least one approver'),
  hiringManagerId: z.string().min(1, 'Hiring manager is required'),
});
export type CreateRequisitionFormValues = z.infer<typeof CreateRequisitionSchema>;

export const UpdateRequisitionSchema = CreateRequisitionSchema.partial();
export type UpdateRequisitionFormValues = z.infer<typeof UpdateRequisitionSchema>;

export const ApproveRequisitionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});
export type ApproveRequisitionFormValues = z.infer<typeof ApproveRequisitionSchema>;

export const MoveStageSchema = z.object({
  stageId: z.string().min(1, 'Target stage is required'),
});
export type MoveStageFormValues = z.infer<typeof MoveStageSchema>;

export const SubmitScorecardSchema = z.object({
  stageId: z.string().min(1),
  competencyRatings: z.array(z.object({
    competencyId: z.string(),
    competencyName: z.string(),
    rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    notes: z.string().optional().default(''),
  })).min(1, 'Rate at least one competency'),
  strengths: z.string().min(1, 'Strengths are required'),
  concerns: z.string().min(1, 'Concerns are required'),
  overallRecommendation: z.enum(['strongYes', 'yes', 'neutral', 'no', 'strongNo']),
});
export type SubmitScorecardFormValues = z.infer<typeof SubmitScorecardSchema>;

export const CreateCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  source: z.enum(['careerSite', 'referral', 'agency', 'sourced', 'inbound']),
  referredBy: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPassiveTalent: z.boolean().default(false),
  notes: z.string().optional(),
});
export type CreateCandidateFormValues = z.infer<typeof CreateCandidateSchema>;

export const PublicApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  coverLetter: z.string().optional(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string() })).default([]),
  consentGiven: z.literal(true, { errorMap: () => ({ message: 'You must consent to data processing to apply' }) }),
});
export type PublicApplicationFormValues = z.infer<typeof PublicApplicationSchema>;

export const ExtendOfferSchema = z.object({
  salary: z.coerce.number().min(0, 'Salary is required'),
  currency: z.string().min(1).default('KES'),
  startDate: z.string().min(1, 'Start date is required'),
  expiresAt: z.string().min(1, 'Expiry date is required'),
});
export type ExtendOfferFormValues = z.infer<typeof ExtendOfferSchema>;
