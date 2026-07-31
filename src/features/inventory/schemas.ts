import { z } from 'zod';

// Client-only validation (no shared runtime between the CJS backend and this TS
// frontend) — the backend independently validates via validateRequiredFields + explicit
// checks, matching every other module's convention in this codebase.

export const ItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unitOfMeasure: z.string().min(1),
  costPrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  barcode: z.string().optional(),
  isTracked: z.boolean().default(true),
  trackingMode: z.enum(['none', 'lot', 'serial', 'batch']).default('none'),
  expiryTrackingEnabled: z.boolean().default(false),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional(),
  discountValue: z.coerce.number().min(0).optional(),
  taxCategory: z.enum(['standard', 'zero_rated', 'exempt']).default('standard'),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});
export type ItemFormValues = z.infer<typeof ItemSchema>;

export const LocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['warehouse', 'store', 'room', 'other']),
  address: z.string().optional(),
  department: z.string().optional(),
});
export type LocationFormValues = z.infer<typeof LocationSchema>;

export const SupplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  leadTimeDays: z.coerce.number().min(0).default(0),
});
export type SupplierFormValues = z.infer<typeof SupplierSchema>;

export const CategorySchema = z.object({ name: z.string().min(1) });
export type CategoryFormValues = z.infer<typeof CategorySchema>;

export const CustomFieldDefSchema = z.object({
  name: z.string().min(1),
  fieldType: z.enum(['text', 'number', 'date', 'select']),
  options: z.array(z.string()).optional(),
});
export type CustomFieldDefFormValues = z.infer<typeof CustomFieldDefSchema>;
