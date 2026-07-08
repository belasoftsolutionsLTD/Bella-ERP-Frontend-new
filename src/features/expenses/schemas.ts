import { z } from 'zod';

// Client-only validation (no shared runtime between this CJS backend and TS frontend) —
// the backend independently validates via validateRequiredFields + explicit checks,
// matching every other module's convention in this codebase.

export const ExpenseLineItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  currency: z.string().min(1).default('KES'),
  expenseDate: z.string().min(1, 'Date is required'),
  receiptFile: z.string().optional(),
  merchantName: z.string().optional(),
  notes: z.string().optional(),
});
export type ExpenseLineItemFormValues = z.infer<typeof ExpenseLineItemSchema>;

export const CreateExpenseClaimSchema = z.object({
  type: z.enum(['regular', 'per_diem', 'mileage', 'itemized']),
  category: z.string().optional(),
  amount: z.coerce.number().optional(), // required for regular; derived server-side for per_diem/mileage/itemized
  currency: z.string().default('KES'),
  date: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  distanceKm: z.coerce.number().optional(),
  isRoundTrip: z.boolean().optional(),
  projectId: z.string().optional(),
  isBillable: z.boolean().optional(),
  items: z.array(ExpenseLineItemSchema).optional(),
});
export type CreateExpenseClaimFormValues = z.infer<typeof CreateExpenseClaimSchema>;

export const AddExpenseItemSchema = ExpenseLineItemSchema;
export type AddExpenseItemFormValues = z.infer<typeof AddExpenseItemSchema>;

export const ApproveExpenseSchema = z.object({
  comment: z.string().optional(),
});
export type ApproveExpenseFormValues = z.infer<typeof ApproveExpenseSchema>;

export const RejectExpenseSchema = z.object({
  reason: z.string().min(2, 'A rejection reason is required'),
});
export type RejectExpenseFormValues = z.infer<typeof RejectExpenseSchema>;

export const ExpensePolicyCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Category name is required'),
  maxAmountPerClaim: z.coerce.number().optional(),
  maxAmountPerDay: z.coerce.number().optional(),
  requiresReceipt: z.boolean().default(false),
  requiresDescription: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  allowedCurrencies: z.array(z.string()).default(['KES']),
});

export const CreateExpensePolicySchema = z.object({
  name: z.string().min(2, 'Policy name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  appliesTo: z.object({
    roles: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    employeeIds: z.array(z.string()).optional(),
  }).default({}),
  categories: z.array(ExpensePolicyCategorySchema).default([]),
  approvalChain: z.array(z.object({
    level: z.number().int().positive(),
    approverRole: z.enum(['manager', 'department_head', 'hr_manager', 'super_admin', 'specificUser']),
    approverId: z.string().optional(),
    thresholdAmount: z.coerce.number().optional(),
  })).default([]),
  defaultPerDiemRate: z.coerce.number().optional(),
  mileageRate: z.coerce.number().optional(),
  reimbursementCycle: z.enum(['withNextPayroll', 'weekly', 'monthly']).default('withNextPayroll'),
});
export type CreateExpensePolicyFormValues = z.infer<typeof CreateExpensePolicySchema>;
