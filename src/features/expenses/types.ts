// Shared TypeScript interfaces for the Expenses feature. Extends the existing
// expense_claims / expense_policies collections in place — field names that already
// exist (amount, payrollCycleId, approvedBy/At, etc.) are preserved unchanged since
// Payroll, Inbox, Dashboard, and Reports already depend on them.

export type ExpenseType = 'regular' | 'per_diem' | 'mileage' | 'itemized';
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | 'disputed';
export type ApprovalLevelRole = 'manager' | 'department_head' | 'hr_manager' | 'super_admin' | 'specificUser';
export type ApprovalLevelStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalChainEntry {
  level: number;
  approverId: string;
  approverName: string;
  approverRole: ApprovalLevelRole;
  status: ApprovalLevelStatus;
  actedAt?: string;
  comment?: string;
  thresholdAmount?: number;
}

// One line item on an 'itemized' claim — the multi-item shape the spec asked for.
// The three original single-shot types (regular/per_diem/mileage) keep their existing
// top-level fields untouched; 'itemized' is additive, not a replacement.
export interface ExpenseLineItem {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptFile?: string;
  merchantName?: string;
  notes?: string;
  policyViolation?: string;
}

export interface ExpenseClaim {
  _id: string;
  employeeId: string;
  type: ExpenseType;
  category?: string;
  amount: number; // authoritative total — for 'itemized' claims this is sum(items.amount)
  currency: string;
  date: string;
  description?: string;
  notes?: string;
  receiptFile?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  perDiemDays?: number;
  fromLocation?: string;
  toLocation?: string;
  distanceKm?: number;
  isRoundTrip?: boolean;
  projectId?: string;
  isBillable?: boolean;
  items?: ExpenseLineItem[]; // only populated for type: 'itemized'
  isPolicyViolation: boolean;
  violationReason?: string;
  policyId?: string;
  approvalChain: ApprovalChainEntry[];
  currentApprovalLevel: number;
  status: ExpenseStatus;
  employee?: { fullName: string; staffNumber: string; department: string };
  approvedBy?: string; approvedAt?: string;
  rejectedBy?: string; rejectedAt?: string; rejectionReason?: string;
  reimbursedAt?: string;
  payrollCycleId?: string;
  createdAt: string; updatedAt: string;
}

export interface ExpensePolicyCategory {
  id: string;
  name: string;
  maxAmountPerClaim?: number;
  maxAmountPerDay?: number;
  requiresReceipt: boolean;
  requiresDescription: boolean;
  requiresApproval: boolean;
  allowedCurrencies: string[];
}

export interface ExpensePolicy {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean; // exactly one policy is the fallback when no other policy targets the employee
  appliesTo: { roles?: string[]; departments?: string[]; employeeIds?: string[] };
  categories: ExpensePolicyCategory[];
  approvalChain: { level: number; approverRole: ApprovalLevelRole; approverId?: string; thresholdAmount?: number }[];
  // Rate-lookup fields already used by per_diem/mileage claim types — preserved as-is
  perDiemRates?: { location: string; rate: number }[];
  defaultPerDiemRate?: number;
  mileageRate?: number;
  reimbursementCycle: 'withNextPayroll' | 'weekly' | 'monthly';
  isActive: boolean;
  createdBy: string;
  createdAt: string; updatedAt: string;
}
