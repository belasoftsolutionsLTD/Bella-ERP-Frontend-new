import { z } from 'zod';

export const CreateVendorSchema = z.object({
  name: z.string().min(2, 'Vendor name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['company', 'individual']),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    sortCode: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});
export type CreateVendorFormValues = z.infer<typeof CreateVendorSchema>;

export const CreateProcurementPolicySchema = z.object({
  name: z.string().min(2, 'Policy name is required'),
  appliesTo: z.object({
    roles: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
  }).default({}),
  approvalChain: z.array(z.object({
    level: z.number().int().positive(),
    approverRole: z.enum(['manager', 'department_head', 'hr_manager', 'super_admin', 'specificUser']),
    approverId: z.string().optional(),
    thresholdAmount: z.coerce.number().optional(),
  })).default([]),
  requiresQuotationAbove: z.coerce.number().optional(),
  preferredVendors: z.array(z.string()).optional(),
});
export type CreateProcurementPolicyFormValues = z.infer<typeof CreateProcurementPolicySchema>;

export const RequisitionItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  estimatedUnitPrice: z.coerce.number().nonnegative(),
  currency: z.string().default('KES'),
  preferredVendorId: z.string().optional(),
  specifications: z.string().optional(),
});

export const CreateRequisitionSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  justification: z.string().min(2, 'Justification is required'),
  priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).default('normal'),
  items: z.array(RequisitionItemSchema).min(1, 'Add at least one item'),
  requiredByDate: z.string().optional(),
  vendorId: z.string().optional(),
});
export type CreateRequisitionFormValues = z.infer<typeof CreateRequisitionSchema>;

export const CreatePurchaseOrderSchema = z.object({
  requisitionId: z.string().min(1),
  vendorId: z.string().min(1, 'Vendor is required'),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().nonnegative(),
    currency: z.string().default('KES'),
    specifications: z.string().optional(),
  })).min(1, 'Add at least one item'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  expectedDeliveryDate: z.string().optional(),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  notes: z.string().optional(),
});
export type CreatePurchaseOrderFormValues = z.infer<typeof CreatePurchaseOrderSchema>;

export const GoodsReceiptSchema = z.object({
  purchaseOrderId: z.string().min(1),
  items: z.array(z.object({
    poItemId: z.string().min(1),
    receivedQuantity: z.coerce.number().nonnegative(),
    condition: z.enum(['good', 'damaged', 'partial']).default('good'),
    notes: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});
export type GoodsReceiptFormValues = z.infer<typeof GoodsReceiptSchema>;

export const VendorInvoiceSchema = z.object({
  purchaseOrderId: z.string().min(1),
  vendorId: z.string().min(1),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().nonnegative(),
  })).min(1, 'Add at least one item'),
  currency: z.string().default('KES'),
});
export type VendorInvoiceFormValues = z.infer<typeof VendorInvoiceSchema>;
