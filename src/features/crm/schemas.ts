import { z } from 'zod';

// Client-only validation (no shared runtime between the CJS backend and this TS
// frontend) — the backend independently validates via validateRequiredFields, matching
// every other module's convention in this codebase.

export const ContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type ContactFormValues = z.infer<typeof ContactSchema>;

export const CompanySchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
});
export type CompanyFormValues = z.infer<typeof CompanySchema>;

// General-purpose industry list — same "curated list + Other free-text fallback"
// pattern as KENYA_BANKS in the Employees module (EmployeeSchema.tsx), so no business
// type is ever blocked by an incomplete preset list.
export const INDUSTRIES = [
  'Retail', 'Wholesale & Distribution', 'Manufacturing', 'Technology', 'Healthcare',
  'Finance & Insurance', 'Real Estate', 'Construction', 'Education', 'Hospitality & Tourism',
  'Food & Beverage', 'Transportation & Logistics', 'Agriculture', 'Energy & Utilities',
  'Media & Entertainment', 'Professional Services', 'Non-Profit', 'Government',
];

export const DealSchema = z.object({
  title: z.string().min(1),
  contactId: z.string().min(1),
  pipelineId: z.string().min(1),
  value: z.coerce.number().min(0).default(0),
  currency: z.string().default('KES'),
  expectedCloseDate: z.string().optional(),
});
export type DealFormValues = z.infer<typeof DealSchema>;
