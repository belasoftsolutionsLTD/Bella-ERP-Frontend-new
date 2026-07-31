export type PosAccessLevel = 'admin' | 'manager' | 'staff' | null;

export type PaymentMethod = 'cash' | 'card' | 'mpesa';
export type SaleStatus = 'completed' | 'voided' | 'refunded' | 'partially_refunded' | 'failed';
export type DiscountType = 'percentage' | 'fixed';

export interface RegisterSession {
  _id: string;
  locationId: string;
  openedBy: string;
  openedByName?: string;
  openedAt: string;
  openingFloat: number;
  status: 'open' | 'closed';
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  closingCount?: number;
  expectedCash?: number;
  variance?: number;
  cashSales?: number;
  cashRefunds?: number;
  location?: { name: string } | null;
}

export interface CartLine {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal?: number;
  refundedQuantity?: number;
  trackingMode?: string;
  isTracked?: boolean;
  // Carried from the item at add-to-cart time so the cart-wide totals preview can mirror
  // the backend's authoritative computeSaleTotals math (subtotal/tax/cart-discount, which
  // genuinely has to be computed live as the cart changes).
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number | null;
  taxRate?: number;
  // The item's discount, already resolved to a plain per-unit price ONCE at add-to-cart
  // time (same figure the product tile showed before this item was ever added) — the
  // individual cart line reads this directly rather than re-deriving it from
  // discountType/discountValue, so no discount math is visibly "happening" in the cart.
  discountedUnitPrice?: number | null;
}

export interface CartDiscount {
  type: DiscountType;
  value: number;
  amount?: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  // Cash only — what the customer physically handed over, when more than `amount`.
  // Purely informational; never affects the paymentsTotal === total balance check.
  cashTendered?: number;
  changeDue?: number;
  // M-Pesa only — record-keeping, no live gateway integration.
  phoneNumber?: string;
  reference?: string;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  locationId: string;
  registerSessionId: string;
  items: CartLine[];
  cartDiscount: CartDiscount | null;
  promoCode: string | null;
  voucherCode: string | null;
  voucherAmount: number;
  subtotal: number;
  autoDiscountTotal: number;
  lineDiscountTotal: number;
  cartDiscountAmount: number;
  taxTotal: number;
  total: number;
  payments: Payment[];
  status: SaleStatus;
  staffId: string;
  staffName: string;
  createdAt: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface StockShortage {
  itemId: string;
  name: string;
  available: number;
  requested: number;
}

export interface Refund {
  _id: string;
  saleId: string;
  saleNumber: string;
  locationId: string;
  items: { itemId: string; sku: string; name: string; quantity: number; amount: number }[];
  amount: number;
  method: PaymentMethod;
  reason: string | null;
  refundedByName: string;
  createdAt: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: string | null;
  isActive: boolean;
}

export interface Voucher {
  _id: string;
  code: string;
  value: number;
  expiresAt: string | null;
  isActive: boolean;
  redeemedAt: string | null;
  redeemedSaleId: string | null;
}

export interface DailySummary {
  date: string;
  startDate?: string;
  endDate?: string;
  totalSales: number;
  totalTransactions: number;
  totalDiscounts: number;
  totalVoucherAmount: number;
  paymentBreakdown: Record<string, number>;
  topItems: { itemId: string; sku: string; name: string; quantity: number; revenue: number }[];
}

export interface SalesByStaffRow {
  staffId: string;
  staffName: string;
  totalSales: number;
  transactionCount: number;
}

export interface PosStaffAccessRow {
  _id: string;
  name: string;
  email: string;
  posLocationIds: string[];
}
