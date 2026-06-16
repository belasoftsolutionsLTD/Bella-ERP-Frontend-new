import { z } from 'zod';

const VALID_PERIODS = [
  'Q1', 'Q2', 'Q3', 'Q4',
  'H1', 'H2',
  '3M-Jan', '3M-Apr', '3M-Jul', '3M-Oct',
  'Annual', 'Probation', 'Custom',
] as const;

export const appraisalSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  reviewPeriod: z.enum(VALID_PERIODS, { errorMap: () => ({ message: 'Select a review period' }) }),
  reviewYear: z.string().min(4, 'Year is required'),
  rating: z.number().min(1).max(5),
  goalsSet: z.string().optional(),
  goalsAchieved: z.string().optional(),
  comments: z.string().optional(),
});

export type AppraisalFormValues = z.infer<typeof appraisalSchema>;
