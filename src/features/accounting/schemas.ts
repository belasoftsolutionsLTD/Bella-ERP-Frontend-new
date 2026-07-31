import { z } from 'zod';

export const AccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subType: z.string().optional(),
  parentId: z.string().optional(),
  normalBalance: z.enum(['debit', 'credit']).optional(),
});
export type AccountFormValues = z.infer<typeof AccountSchema>;

export const JournalLineSchema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  memo: z.string().optional(),
});

export const ManualJournalEntrySchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(JournalLineSchema).min(2, 'At least 2 lines are required'),
}).refine((v) => {
  const totalDebit = v.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = v.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, { message: 'Debits must equal credits', path: ['lines'] });
export type ManualJournalEntryFormValues = z.infer<typeof ManualJournalEntrySchema>;
