import { z } from 'zod';

// Client-only validation (no shared runtime between this CJS backend and TS frontend) —
// the backend independently validates via validateRequiredFields + explicit checks,
// matching every other module's convention in this codebase.

export const OnboardingTaskTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional().default(''),
  dueOffsetDays: z.coerce.number().int(),
  isRequired: z.boolean().default(true),
  requiresDocument: z.boolean().default(false),
  documentTemplateId: z.string().optional(),
  resourceUrl: z.string().optional(),
});

export const OnboardingTaskListTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'List name is required'),
  assignedTo: z.enum(['hr', 'it', 'manager', 'newHire', 'finance']),
  tasks: z.array(OnboardingTaskTemplateSchema).default([]),
});

export const MeetTheTeamTemplateEntrySchema = z.object({
  employeeId: z.string().min(1),
  note: z.string().optional().default(''),
});

export const FirstDayDetailsSchema = z.object({
  location: z.string().optional().default(''),
  reportingTime: z.string().optional().default(''),
  whatToBring: z.string().optional().default(''),
  additionalNotes: z.string().optional().default(''),
});

export const CreateOnboardingTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  description: z.string().optional().default(''),
  targetRoles: z.array(z.string()).default([]),
  targetDepartments: z.array(z.string()).default([]),
  welcomeMessage: z.string().optional().default(''),
  firstDayDetails: FirstDayDetailsSchema.default({}),
  taskLists: z.array(OnboardingTaskListTemplateSchema).default([]),
  meetTheTeam: z.array(MeetTheTeamTemplateEntrySchema).default([]),
});
export type CreateOnboardingTemplateFormValues = z.infer<typeof CreateOnboardingTemplateSchema>;

export const InitiateOnboardingSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  templateId: z.string().min(1, 'Template is required'),
  startDate: z.string().min(1, 'Start date is required'),
});
export type InitiateOnboardingFormValues = z.infer<typeof InitiateOnboardingSchema>;

export const UpdateOnboardingTaskSchema = z.object({
  status: z.enum(['pending', 'inProgress', 'completed', 'overdue']).optional(),
  notes: z.string().optional(),
});
export type UpdateOnboardingTaskFormValues = z.infer<typeof UpdateOnboardingTaskSchema>;

export const UploadOnboardingDocumentSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['upload', 'esign', 'form']).default('upload'),
});
export type UploadOnboardingDocumentFormValues = z.infer<typeof UploadOnboardingDocumentSchema>;
