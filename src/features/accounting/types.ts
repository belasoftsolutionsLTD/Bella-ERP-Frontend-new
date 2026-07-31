export type AccountingAccessLevel = 'admin' | 'bookkeeper' | 'viewer' | null;
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';
export type JournalEntryStatus = 'posted' | 'reversed';
export type PeriodStatus = 'open' | 'closed';

export interface GlAccount {
  _id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: string | null;
  parentId: string | null;
  normalBalance: NormalBalance;
  isSystemAccount: boolean;
  systemKey: string | null;
  linkedExpenseCategories: string[];
  isActive: boolean;
  balanceCache: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  department: string | null;
  memo: string | null;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  description: string | null;
  source: string;
  sourceModule: string | null;
  referenceId: string | null;
  referenceModel: string | null;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  reversedByEntryId: string | null;
  reversesEntryId: string | null;
  department: string | null;
  postedBy: string;
  postedAt: string;
  createdAt: string;
}

export interface AccountingPeriod {
  _id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  closedAt?: string;
  closedBy?: string;
}

export type ArInvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';

export interface ArInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface ArPayment {
  _id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
  recordedBy: string;
}

export interface ArInvoice {
  _id: string;
  invoiceNumber: string;
  customerId: string | null;
  customerSnapshot: { name: string; email: string | null; billingAddress: string | null };
  items: ArInvoiceLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  status: ArInvoiceStatus;
  createdAt: string;
  sentAt: string | null;
  paidAt: string | null;
  payments?: ArPayment[];
}

export type ApBillStatus = 'draft' | 'approved' | 'scheduled' | 'paid';

export interface ApBillLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ApBill {
  _id: string;
  billNumber: string;
  vendorName: string;
  expenseAccountId: string | null;
  items: ApBillLine[];
  totalAmount: number;
  dueDate: string;
  scheduledPaymentDate: string | null;
  status: ApBillStatus;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface BankStatementLine {
  date: string;
  description: string;
  amount: number;
  matched: boolean;
  matchedJournalEntryId: string | null;
  flagged: boolean;
  flagReason: string | null;
}

export interface BankStatementImport {
  _id: string;
  accountId: string;
  filename: string;
  importedAt: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  lines: BankStatementLine[];
  status: 'in_progress' | 'reconciled';
  reconciledAt: string | null;
  unrecordedInLedger?: { entryId: string; entryNumber: string; date: string; description: string | null; debit: number; credit: number }[];
}

export interface PostingFailure {
  _id: string;
  source: string;
  sourceModule: string | null;
  referenceId: string | null;
  referenceModel: string | null;
  attemptedPayload: Record<string, unknown>;
  error: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}
