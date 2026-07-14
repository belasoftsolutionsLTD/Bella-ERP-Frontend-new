import { z } from 'zod';

// Client-only validation (no shared runtime between this CJS backend and TS frontend) —
// the backend independently validates via validateRequiredFields + explicit checks,
// matching every other module's convention in this codebase.

const AppliesToSchema = z.object({
  roles: z.array(z.string()).optional().default([]),
  departments: z.array(z.string()).optional().default([]),
  employmentTypes: z.array(z.string()).optional().default([]),
});

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(6, 'Code should be short, e.g. AL'),
  description: z.string().optional().default(''),
  isPaid: z.boolean().default(true),
  isCarryOverAllowed: z.boolean().default(false),
  maxCarryOverDays: z.coerce.number().min(0).optional(),
  carryOverExpiryMonths: z.coerce.number().min(0).optional(),
  requiresApproval: z.boolean().default(true),
  requiresAttachment: z.boolean().default(false),
  minNoticeDays: z.coerce.number().min(0).optional(),
  maxConsecutiveDays: z.coerce.number().min(0).optional(),
  eligibilityMonths: z.coerce.number().min(0).optional(),
  countPublicHolidays: z.boolean().default(false),
  color: z.string().min(1).default('#3b82f6'),
  isActive: z.boolean().default(true),
  appliesTo: AppliesToSchema.default({}),
});
export type CreateLeaveTypeFormValues = z.infer<typeof CreateLeaveTypeSchema>;

export const CreateAccrualPolicySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  accrualFrequency: z.enum(['monthly', 'annual', 'perHourWorked']),
  accrualAmount: z.coerce.number().min(0, 'Must be 0 or more'),
  maxAnnualEntitlement: z.coerce.number().min(0, 'Must be 0 or more'),
  appliesTo: AppliesToSchema.default({}),
  isActive: z.boolean().default(true),
});
export type CreateAccrualPolicyFormValues = z.infer<typeof CreateAccrualPolicySchema>;

export const CreateLeaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  halfDay: z.object({ date: z.string(), period: z.enum(['morning', 'afternoon']) }).optional(),
  reason: z.string().optional().default(''),
  attachmentUrl: z.string().optional(),
});
export type CreateLeaveRequestFormValues = z.infer<typeof CreateLeaveRequestSchema>;

export const ApproveLeaveSchema = z.object({
  comment: z.string().optional().default(''),
});
export type ApproveLeaveFormValues = z.infer<typeof ApproveLeaveSchema>;

export const RejectLeaveSchema = z.object({
  rejectionReason: z.string().min(2, 'Please provide a reason'),
});
export type RejectLeaveFormValues = z.infer<typeof RejectLeaveSchema>;

export const AdjustBalanceSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  amount: z.coerce.number().refine(v => v !== 0, 'Amount must not be zero'),
  reason: z.string().min(2, 'Please provide a reason'),
});
export type AdjustBalanceFormValues = z.infer<typeof AdjustBalanceSchema>;

export const CreatePublicHolidaySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  isRecurringAnnually: z.boolean().default(false),
  appliesTo: z.array(z.string()).optional().default([]),
});
export type CreatePublicHolidayFormValues = z.infer<typeof CreatePublicHolidaySchema>;

// Bonus features ported from the old system:
export const CreateBlackoutSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  departments: z.array(z.string()).optional().default([]),
});
export type CreateBlackoutFormValues = z.infer<typeof CreateBlackoutSchema>;

export const DisputeLeaveSchema = z.object({
  disputeReason: z.string().min(2, 'Please explain why you are disputing this'),
});
export type DisputeLeaveFormValues = z.infer<typeof DisputeLeaveSchema>;

export const ResolveDisputeSchema = z.object({
  resolution: z.enum(['upheld', 'overturned']),
  comment: z.string().optional().default(''),
});
export type ResolveDisputeFormValues = z.infer<typeof ResolveDisputeSchema>;
