// Shared TypeScript interfaces for the Spending feature's Procurement pipeline.
// purchase_requests already exists (title/estimatedCost/currency/priority/vendor as a
// free-text string/department/items/neededBy/status) — extended here with vendorId,
// an approval chain, and a policy reference, without renaming the collection or
// breaking existing fields. Vendors, purchase orders, goods receipts, and vendor
// invoices are genuinely new — the PR stage was the only piece that existed before.

import type { ApprovalChainEntry } from '../expenses/types';

export type PRStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'converted';
export type PRPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';
export type POStatus = 'draft' | 'sent' | 'acknowledged' | 'partiallyReceived' | 'fullyReceived' | 'cancelled' | 'invoiced' | 'paid';
export type VendorStatus = 'pending_approval' | 'active' | 'inactive' | 'rejected' | 'blacklisted';
export type VendorType = 'company' | 'individual';
export interface VendorDocument { docId: string; docType: string; fileName: string; filePath: string; uploadedAt: string; }
export type ReceiptCondition = 'good' | 'damaged' | 'partial';
export type ReceiptStatus = 'complete' | 'partial' | 'disputed';
export type InvoiceStatus = 'received' | 'underReview' | 'matched' | 'disputed' | 'approved' | 'paid';
export type ThreeWayMatchStatus = 'matched' | 'discrepancy' | 'pending';

export interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  estimatedUnitPrice: number;
  currency: string;
  preferredVendorId?: string;
  specifications?: string;
}

export interface PurchaseRequest {
  _id: string;
  title: string;
  description?: string;
  justification?: string;
  estimatedCost: number; // authoritative total — kept for backward compat, equals sum(items) when items are used
  currency: string;
  priority: PRPriority;
  vendor?: string; // legacy free-text vendor name, kept for backward compat
  vendorId?: string; // new — references vendors collection
  department?: string;
  items: RequisitionItem[];
  neededBy?: string;
  requiredByDate?: string; // alias field name from the spec; neededBy remains authoritative
  policyId?: string;
  approvalChain: ApprovalChainEntry[];
  currentApprovalLevel: number;
  status: PRStatus;
  requestedBy: string; // users._id
  employeeId?: string; // employees._id
  convertedToPOId?: string;
  rejectionReason?: string;
  requester?: { fullName: string; department: string } | null;
  createdAt: string; updatedAt: string;
}

export interface Vendor {
  _id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  category: string;
  type: VendorType;
  taxId?: string;
  paymentTerms?: string;
  bankDetails?: { accountName?: string; accountNumber?: string; bankName?: string; sortCode?: string };
  documents?: VendorDocument[];
  status: VendorStatus;
  notes?: string;
  approvedBy?: string | null; approvedAt?: string | null;
  rejectedBy?: string | null; rejectedAt?: string | null; rejectionReason?: string | null;
  createdBy: string;
  createdAt: string; updatedAt: string;
}

export interface ProcurementPolicy {
  _id: string;
  name: string;
  appliesTo: { roles?: string[]; departments?: string[] };
  approvalChain: { level: number; approverRole: string; approverId?: string; thresholdAmount?: number }[];
  requiresQuotationAbove?: number;
  preferredVendors?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  receivedQuantity: number;
  specifications?: string;
}

export interface PurchaseOrder {
  _id: string;
  requisitionId: string;
  poNumber: string;
  vendorId: string;
  vendor?: Vendor | null;
  requestedBy: string;
  departmentId?: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  paymentTerms: string;
  notes?: string;
  attachmentUrls?: string[];
  invoiceId?: string;
  createdBy: string;
  createdAt: string; updatedAt: string;
}

export interface GoodsReceiptItem {
  poItemId: string;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  condition: ReceiptCondition;
  notes?: string;
}

export interface GoodsReceipt {
  _id: string;
  purchaseOrderId: string;
  receivedBy: string;
  receivedAt: string;
  items: GoodsReceiptItem[];
  status: ReceiptStatus;
  notes?: string;
  attachmentUrls?: string[];
  createdAt: string;
}

export interface VendorInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface VendorInvoice {
  _id: string;
  purchaseOrderId: string;
  vendorId: string;
  vendor?: Vendor | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: VendorInvoiceItem[];
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  threeWayMatchStatus: ThreeWayMatchStatus;
  discrepancyNotes?: string;
  fileUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string; updatedAt: string;
}
