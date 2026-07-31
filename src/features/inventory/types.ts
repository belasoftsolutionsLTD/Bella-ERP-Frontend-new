export type InventoryAccessLevel = 'admin' | 'manager' | 'clerk' | null;

export type TrackingMode = 'none' | 'lot' | 'serial' | 'batch';
export type MovementType = 'receipt' | 'sale' | 'adjustment' | 'transfer_out' | 'transfer_in' | 'return';
export type POStatus = 'draft' | 'pending' | 'pending_delivery' | 'partially_received' | 'received' | 'pending_payment_approval' | 'closed';
export type TransferStatus = 'requested' | 'approved' | 'received' | 'rejected';
export type LocationType = 'warehouse' | 'store' | 'room' | 'other';
export type CustomFieldType = 'text' | 'number' | 'date' | 'select';

export interface InventoryCategory {
  _id: string;
  name: string;
  isActive?: boolean;
}

export interface InventoryBrand {
  _id: string;
  name: string;
  isActive?: boolean;
}

export interface InventoryUnitOfMeasure {
  _id: string;
  name: string;
  isActive?: boolean;
}

export interface CustomFieldDef {
  _id: string;
  name: string;
  fieldType: CustomFieldType;
  options: string[];
  isActive?: boolean;
}

export interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  description: string;
  category: string | null;
  brand: string | null;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  barcode: string | null;
  isTracked: boolean;
  trackingMode: TrackingMode;
  expiryTrackingEnabled: boolean;
  costingMethod: 'weighted_average';
  avgCost: number;
  imageUrl: string | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  taxCategory: 'standard' | 'zero_rated' | 'exempt';
  taxRate: number;
  customFieldValues: Record<string, string | number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLocation {
  _id: string;
  name: string;
  type: LocationType;
  address: string;
  department: string | null;
  isActive: boolean;
}

export interface StockLevel {
  _id: string;
  itemId: string;
  locationId: string;
  quantity: number;
  reorderPoint: number;
  updatedAt: string;
  item?: Pick<InventoryItem, 'sku' | 'name' | 'category' | 'unitOfMeasure'> | null;
  location?: Pick<InventoryLocation, 'name' | 'type'> | null;
}

export interface StockMovement {
  _id: string;
  itemId: string;
  locationId: string;
  quantityChange: number;
  movementType: MovementType;
  referenceId: string | null;
  referenceModel: string | null;
  unitCost: number | null;
  lotId: string | null;
  balanceAfter: number;
  performedBy: string | null;
  performedByName?: string;
  notes: string | null;
  createdAt: string;
  item?: Pick<InventoryItem, 'sku' | 'name' | 'unitOfMeasure'> | null;
  location?: Pick<InventoryLocation, 'name'> | null;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  linkedItemIds: string[];
  linkedItems?: Pick<InventoryItem, '_id' | 'sku' | 'name'>[];
  leadTimeDays: number;
  isActive: boolean;
}

export interface POLine {
  itemId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  item?: Pick<InventoryItem, 'sku' | 'name' | 'unitOfMeasure' | 'trackingMode'> | null;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  locationId: string;
  items: POLine[];
  status: POStatus;
  expectedDeliveryDate: string | null;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
  closedAt?: string;
  invoiceNumber?: string; // the supplier's own invoice number, as printed on their invoice
  poInvoiceNumber?: string; // our auto-generated internal reference, e.g. PO-MW-2026-00001
  invoiceReceivedAt?: string;
  invoiceAmount?: number | null;
  invoiceDueDate?: string | null;
  paymentStatus?: 'unpaid' | 'pending_approval' | 'paid' | 'rejected';
  paymentMethod?: string;
  paymentReference?: string;
  paymentEvidenceFilename?: string | null;
  paymentEvidenceOriginalName?: string | null;
  paidAt?: string | null;
  paymentRequestedBy?: string;
  paymentRequestedAt?: string | null;
  paymentApprovedBy?: string;
  paymentApprovedAt?: string | null;
  paymentRejectionReason?: string | null;
  paymentRejectedAt?: string | null;
  supplier?: Pick<Supplier, 'name' | 'leadTimeDays'> | null;
  location?: Pick<InventoryLocation, 'name'> | null;
}

export interface TransferLine {
  itemId: string;
  quantity: number;
  lotNumber: string | null;
  item?: Pick<InventoryItem, 'sku' | 'name' | 'unitOfMeasure' | 'trackingMode'> | null;
}

export interface StockTransfer {
  _id: string;
  fromLocationId: string;
  toLocationId: string;
  items: TransferLine[];
  status: TransferStatus;
  requestNotes: string | null;
  requestedBy: string;
  requestedByName?: string | null;
  approvedBy?: string;
  approvedByName?: string | null;
  rejectedBy?: string;
  rejectedByName?: string | null;
  receivedBy?: string;
  receivedByName?: string | null;
  rejectionReason?: string;
  createdAt: string;
  fromLocation?: Pick<InventoryLocation, 'name'> | null;
  toLocation?: Pick<InventoryLocation, 'name'> | null;
}

export interface InventoryLot {
  _id: string;
  itemId: string;
  locationId: string;
  lotNumber: string;
  quantityRemaining: number;
  expiryDate: string | null;
  receivedAt: string;
  isExpired?: boolean;
  location?: Pick<InventoryLocation, 'name'> | null;
}

export interface LowStockAlert extends StockLevel {}

export interface ValuationReport {
  total: number;
  byLocation: { locationId: string; location: Pick<InventoryLocation, 'name'> | null; quantity: number; value: number }[];
  byItem: { itemId: string; item: Pick<InventoryItem, 'sku' | 'name' | 'avgCost' | 'category'>; quantity: number; value: number }[];
}

export interface StockByCategoryRow {
  category: string;
  quantity: number;
  itemCount: number;
}

export interface InventoryInsights {
  nearExpiry: { itemId: string; item: Pick<InventoryItem, 'sku' | 'name'> | null; lotNumber: string; quantityRemaining: number; expiryDate: string; daysUntilExpiry: number }[];
  decliningVelocity: { itemId: string; item: Pick<InventoryItem, 'sku' | 'name'>; priorPeriodSales: number; recentPeriodSales: number; percentDrop: number }[];
  valuationConcentration: { category: string; value: number; percentOfTotal: number }[];
}

export interface InventoryStaffAccessRow {
  _id: string;
  name: string;
  email: string;
  employeeId: string | null;
  isInventoryClerk: boolean;
}
