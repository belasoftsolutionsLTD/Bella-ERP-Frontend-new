import { z } from 'zod';

// Client-only validation (no shared runtime between this CJS backend and TS frontend) —
// the backend independently validates via validateRequiredFields + explicit checks,
// matching every other module's convention in this codebase.

const EXIT_TYPES = ['resignation', 'termination', 'retirement', 'redundancy', 'contract_end'] as const;
const TASK_CATEGORIES = [
  'assetRecovery', 'accessRevocation', 'knowledgeTransfer',
  'documentation', 'exitInterview', 'finalPay', 'general',
] as const;

export const OffboardingTaskTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional().default(''),
  dueOffsetDays: z.coerce.number().int(),
  isRequired: z.boolean().default(true),
  category: z.enum(TASK_CATEGORIES).default('general'),
  // Internal hook for special backend behavior (e.g. 'spend_clearance') — not part
  // of the spec's category enum, ported from the old system's taskType field.
  taskType: z.enum(['spend_clearance']).optional(),
  requiresDocument: z.boolean().default(false),
});

export const OffboardingTaskListTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'List name is required'),
  assignedTo: z.enum(['hr', 'it', 'manager', 'finance', 'employee']),
  tasks: z.array(OffboardingTaskTemplateSchema).default([]),
});

export const AssetChecklistTemplateItemSchema = z.object({
  id: z.string().min(1),
  item: z.string().min(1, 'Item name is required'),
  category: z.enum(['device', 'accessCard', 'keys', 'uniform', 'other']),
});

export const AccessRevocationTemplateItemSchema = z.object({
  id: z.string().min(1),
  system: z.string().min(1, 'System name is required'),
  category: z.enum(['email', 'software', 'buildingAccess', 'vpn', 'other']),
});

export const CreateOffboardingTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  exitTypes: z.array(z.enum(EXIT_TYPES)).min(1, 'Select at least one exit type'),
  taskLists: z.array(OffboardingTaskListTemplateSchema).default([]),
  assetChecklist: z.array(AssetChecklistTemplateItemSchema).default([]),
  accessRevocationList: z.array(AccessRevocationTemplateItemSchema).default([]),
  documentsToGenerate: z.array(z.enum(['experienceLetter', 'relievingLetter', 'clearanceCertificate', 'finalPayslip'])).default([]),
});
export type CreateOffboardingTemplateFormValues = z.infer<typeof CreateOffboardingTemplateSchema>;

export const InitiateOffboardingSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  templateId: z.string().min(1, 'Template is required'),
  exitType: z.enum(EXIT_TYPES),
  exitReason: z.string().optional().default(''),
  lastWorkingDay: z.string().min(1, 'Last working day is required'),
  noticePeriodStartDate: z.string().optional(),
});
export type InitiateOffboardingFormValues = z.infer<typeof InitiateOffboardingSchema>;

export const UpdateOffboardingTaskSchema = z.object({
  status: z.enum(['pending', 'inProgress', 'completed', 'overdue']).optional(),
  notes: z.string().optional(),
});
export type UpdateOffboardingTaskFormValues = z.infer<typeof UpdateOffboardingTaskSchema>;

export const AssetReturnSchema = z.object({
  returned: z.boolean(),
  condition: z.string().optional(),
  notes: z.string().optional(),
});
export type AssetReturnFormValues = z.infer<typeof AssetReturnSchema>;

export const AccessRevocationSchema = z.object({
  revoked: z.boolean(),
});
export type AccessRevocationFormValues = z.infer<typeof AccessRevocationSchema>;

export const ExitInterviewSchema = z.object({
  reasonForLeaving: z.string().min(2, 'Please share a reason for leaving'),
  jobSatisfactionRating: z.coerce.number().int().min(1).max(5),
  managementRating: z.coerce.number().int().min(1).max(5),
  wouldRecommendCompany: z.boolean(),
  suggestions: z.string().optional().default(''),
  additionalComments: z.string().optional().default(''),
});
export type ExitInterviewFormValues = z.infer<typeof ExitInterviewSchema>;

export const GenerateDocumentSchema = z.object({
  type: z.enum(['experienceLetter', 'relievingLetter', 'clearanceCertificate', 'finalPayslip']),
});
export type GenerateDocumentFormValues = z.infer<typeof GenerateDocumentSchema>;
