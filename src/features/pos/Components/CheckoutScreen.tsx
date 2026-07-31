'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, Minus, Trash2, ScanBarcode, AlertTriangle, Loader2, CheckCircle2, Package, Tag, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/configs/constants';
import { fetchAsBlobUrl, resolveUploadUrl } from '@/functions/downloadFile';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { DocViewerModal } from '@/components/custom-ui/DocViewerModal';
import { usePosItems } from '../Hooks/usePosItems';
import { usePosStockLevels } from '../Hooks/usePosStockLevels';
import { useCheckout } from '../Hooks/usePosSales';
import { usePromoCodes } from '../Hooks/usePosConfig';
import type { RegisterSession } from '../types';
import type { CartLine, CartDiscount, Payment, PaymentMethod, Sale, StockShortage } from '../types';

const round2 = (n: number) => Math.round(n * 100) / 100;
const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'mpesa'];

// The /uploads static route requires a valid JWT (header or ?token= query param) — a
// plain <img src> can't send a header, so the token has to go in the query string, same
// pattern already used for profile photos (MyPortalView.tsx's ProfilePhotoAvatar).
function resolveItemImageUrl(imageUrl: string): string {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  return `${resolveUploadUrl(imageUrl)}?token=${encodeURIComponent(token)}`;
}

export function CheckoutScreen({ session }: { session: RegisterSession }) {
  const t = useTranslations('POS');
  const [search, setSearch] = useState('');
  const { items, isLoading: itemsLoading } = usePosItems(search);
  const { stockLevels } = usePosStockLevels(session.locationId);
  const { createSale } = useCheckout();
  // activeOnly — a cashier should only ever see codes that would actually apply right
  // now, unlike the admin Settings panel which lists everything (including expired/
  // disabled codes) so they can still be managed.
  const { promoCodes: activeCodes } = usePromoCodes(true);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscountType, setCartDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [cartDiscountValue, setCartDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountType: 'percentage' | 'fixed'; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [showCodesList, setShowCodesList] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; value: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([{ method: 'cash', amount: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [shortages, setShortages] = useState<StockShortage[]>([]);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const viewReceipt = (saleId: string) => {
    setLoadingReceipt(true);
    fetchAsBlobUrl(`${API_BASE_URL}/pos/sales/${saleId}/receipt`)
      .then(setReceiptUrl)
      .catch(() => {})
      .finally(() => setLoadingReceipt(false));
  };
  const closeReceipt = () => {
    if (receiptUrl) URL.revokeObjectURL(receiptUrl);
    setReceiptUrl(null);
  };

  const stockFor = (itemId: string) => stockLevels.find((s) => s.itemId === itemId)?.quantity ?? null;

  const addToCart = (item: (typeof items)[number]) => {
    // Resolved once, here, at the moment the item is added — the same number already
    // shown on the product tile. The cart line just carries this plain price forward;
    // it never re-derives it from discountType/discountValue.
    const discountedUnitPrice = item.discountType === 'percentage'
      ? round2(item.salePrice * (1 - (item.discountValue || 0) / 100))
      : item.discountType === 'fixed'
        ? Math.max(0, round2(item.salePrice - (item.discountValue || 0)))
        : null;
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === item._id);
      if (existing) return prev.map((l) => (l.itemId === item._id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, {
        itemId: item._id, sku: item.sku, name: item.name, quantity: 1, unitPrice: item.salePrice, discountAmount: 0, isTracked: item.isTracked,
        discountType: item.discountType, discountValue: item.discountValue, taxRate: item.taxRate, discountedUnitPrice,
      }];
    });
  };

  const updateLine = (itemId: string, patch: Partial<CartLine>) => setCart((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, ...patch } : l)));
  const removeLine = (itemId: string) => setCart((prev) => prev.filter((l) => l.itemId !== itemId));

  // Live-narrows the already-fetched active-codes list as the cashier types — no new
  // endpoint, since usePromoCodes(true) already has the full list client-side.
  const promoMatches = useMemo(() => {
    const q = promoCode.trim().toUpperCase();
    return q ? activeCodes.filter((c) => c.code.toUpperCase().startsWith(q)) : [];
  }, [activeCodes, promoCode]);

  // Mirrors computeSaleTotals in backend/src/routes/pos/posSalesFunctions.js exactly —
  // same order (auto-discount -> manual discount -> cart discount, allocated pro-rata
  // across lines -> tax per line at the item's own rate) so this preview never disagrees
  // with what the server actually charges.
  const totals = useMemo(() => {
    const lines = cart.map((l) => {
      const lineSubtotal = round2(l.quantity * l.unitPrice);
      let autoDiscount = 0;
      if (l.discountType === 'percentage') autoDiscount = round2(lineSubtotal * (Number(l.discountValue) || 0) / 100);
      else if (l.discountType === 'fixed') autoDiscount = round2(Math.min((Number(l.discountValue) || 0) * l.quantity, lineSubtotal));
      const manualDiscount = round2(Math.min(l.discountAmount || 0, Math.max(0, lineSubtotal - autoDiscount)));
      const lineDiscount = round2(Math.min(autoDiscount + manualDiscount, lineSubtotal));
      const lineAfterDiscount = round2(lineSubtotal - lineDiscount);
      return { ...l, lineSubtotal, autoDiscount, manualDiscount, lineAfterDiscount, taxRate: l.taxRate || 0 };
    });
    const subtotal = round2(lines.reduce((s, l) => s + l.lineSubtotal, 0));
    const autoDiscountTotal = round2(lines.reduce((s, l) => s + l.autoDiscount, 0));
    const lineDiscountTotal = round2(lines.reduce((s, l) => s + l.manualDiscount, 0));
    const afterLine = round2(subtotal - autoDiscountTotal - lineDiscountTotal);
    let cartDiscountAmount = 0;
    if (cartDiscountType === 'percentage') cartDiscountAmount = round2(afterLine * (Number(cartDiscountValue) || 0) / 100);
    else if (cartDiscountType === 'fixed') cartDiscountAmount = round2(Math.min(Number(cartDiscountValue) || 0, afterLine));

    let taxTotal = 0;
    for (const l of lines) {
      const cartShare = afterLine > 0 ? round2((l.lineAfterDiscount / afterLine) * cartDiscountAmount) : 0;
      const lineFinal = Math.max(0, round2(l.lineAfterDiscount - cartShare));
      taxTotal = round2(taxTotal + round2(lineFinal * (l.taxRate / 100)));
    }

    const total = Math.max(0, round2(afterLine - cartDiscountAmount + taxTotal));
    return { subtotal, autoDiscountTotal, lineDiscountTotal, cartDiscountAmount, taxTotal, total };
  }, [cart, cartDiscountType, cartDiscountValue]);

  // A voucher pays for the transaction after everything else (discounts, tax) is
  // computed — it's applied post-total, not folded into `totals` above, mirroring the
  // backend's createSale (voucher subtracted from totalBeforeVoucher, never re-taxed).
  const voucherAmount = appliedVoucher ? round2(Math.min(appliedVoucher.value, totals.total)) : 0;
  const amountDue = Math.max(0, round2(totals.total - voucherAmount));

  // With only one payment method selected, there's nothing to "split" — the full amount
  // due always goes on that one leg. Forcing the cashier to also type a matching amount
  // (on top of picking cash/card/mpesa) was the actual bug: someone paying with a single
  // KES 1000 note for a KES 500 total had no way to make "Complete Sale" activate short
  // of adding more items, because the leftover manual `amount` field never auto-followed
  // the total. Split payments (2+ methods) still need an explicit amount per leg, since
  // that's a real choice the cashier is making.
  useEffect(() => {
    if (payments.length === 1 && payments[0].amount !== amountDue) {
      setPayments([{ ...payments[0], amount: amountDue }]);
    }
  }, [amountDue, payments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentsTotal = round2(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const balanced = Math.abs(paymentsTotal - amountDue) < 0.01 && amountDue > 0;

  const nextUnusedMethod = (): PaymentMethod | null => ALL_PAYMENT_METHODS.find((m) => !payments.some((p) => p.method === m)) ?? null;
  const addPaymentMethod = () => {
    const method = nextUnusedMethod();
    if (!method) return;
    setPayments((prev) => [...prev, { method, amount: 0 }]);
  };
  const updatePaymentField = (idx: number, patch: Partial<Payment>) => setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const removePayment = (idx: number) => setPayments((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const applyPromoCode = (codeOverride?: string) => {
    const codeToApply = codeOverride ?? promoCode;
    if (!codeToApply.trim()) return;
    setCheckingPromo(true);
    setPromoError('');
    apiCallFunction<any>({
      url: `${API_BASE_URL}/pos/promo-codes/check/${encodeURIComponent(codeToApply.trim())}`,
      showToast: false,
      thenFn: (r) => setAppliedPromo(r.data),
      catchFn: () => { setAppliedPromo(null); setPromoError(t('checkout.promoInvalid')); },
      finallyFn: () => setCheckingPromo(false),
    });
  };
  const clearPromoCode = () => { setPromoCode(''); setAppliedPromo(null); setPromoError(''); };

  const applyVoucher = () => {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    setVoucherError('');
    apiCallFunction<any>({
      url: `${API_BASE_URL}/pos/vouchers/check/${encodeURIComponent(voucherCode.trim())}`,
      showToast: false,
      thenFn: (r) => setAppliedVoucher(r.data),
      catchFn: () => { setAppliedVoucher(null); setVoucherError(t('checkout.voucherInvalid')); },
      finallyFn: () => setCheckingVoucher(false),
    });
  };
  const clearVoucher = () => { setVoucherCode(''); setAppliedVoucher(null); setVoucherError(''); };

  const checkout = () => {
    if (!cart.length || !balanced) return;
    setSubmitting(true);
    setShortages([]);
    createSale({
      items: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity, unitPrice: l.unitPrice, discountAmount: l.discountAmount })),
      cartDiscount: cartDiscountType !== 'none' ? { type: cartDiscountType, value: Number(cartDiscountValue) || 0 } : null,
      payments,
      promoCode: appliedPromo?.code || promoCode || undefined,
      voucherCode: appliedVoucher?.code || undefined,
    })
      ?.then((res: any) => {
        if (res?.data) {
          setCompletedSale(res.data);
          setCart([]); setCartDiscountType('none'); setCartDiscountValue(''); clearPromoCode(); clearVoucher();
          setPayments([{ method: 'cash', amount: 0 }]);
        } else if (res?.shortages) {
          setShortages(res.shortages);
        }
      })
      .finally(() => setSubmitting(false));
  };

  if (completedSale) {
    return (
      <div className="max-w-sm mx-auto py-16 text-center space-y-4">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('checkout.saleComplete')}</h2>
          <p className="text-sm text-slate-500 mt-1">{completedSale.saleNumber} · {completedSale.total.toLocaleString()}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => viewReceipt(completedSale._id)} disabled={loadingReceipt}
            className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-50">
            {loadingReceipt ? t('common.saving') : t('checkout.viewReceipt')}
          </button>
          <button onClick={() => setCompletedSale(null)} className="h-10 px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold">{t('checkout.newSale')}</button>
        </div>
        {receiptUrl && (
          <DocViewerModal url={receiptUrl} fileName={`receipt-${completedSale.saleNumber}.pdf`} onClose={closeReceipt} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* Item search + results */}
      <div className="space-y-3">
        <div className="relative">
          <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('checkout.searchPlaceholder')}
            className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>
        {itemsLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand-primary/40" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {items.map((item) => {
              const available = item.isTracked ? stockFor(item._id) : null;
              const outOfStock = item.isTracked && (available ?? 0) <= 0;
              const discountedPrice = item.discountType === 'percentage'
                ? round2(item.salePrice * (1 - (item.discountValue || 0) / 100))
                : item.discountType === 'fixed'
                  ? Math.max(0, round2(item.salePrice - (item.discountValue || 0)))
                  : null;
              return (
                <button key={item._id} onClick={() => addToCart(item)} disabled={outOfStock}
                  className={cn('relative text-left rounded-xl border p-3 hover:border-brand-primary/40 transition-colors',
                    outOfStock ? 'border-red-100 bg-red-50/50 opacity-60 cursor-not-allowed' : 'border-slate-200 bg-white')}>
                  <div className="relative aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-2">
                    {item.imageUrl ? (
                      // object-contain, not object-cover — a tall/narrow product (a bottle,
                      // a can) shouldn't get cropped to fill the box; letterboxing on a
                      // neutral background reads better than losing the top/bottom of the item.
                      <img src={resolveItemImageUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-contain" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300" />
                    )}
                    {/* The discount is set on the product itself, not applied later at
                        checkout — visible here so a cashier (and customer) already knows
                        the deal before the item is even added to the cart. */}
                    {item.discountType && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        {item.discountType === 'percentage' ? `-${item.discountValue}%` : `-${item.discountValue?.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  {item.brand && <p className="text-[10px] text-slate-400 truncate">{item.brand}</p>}
                  <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    {discountedPrice !== null ? (
                      <span className="text-sm">
                        <span className="line-through text-slate-400 mr-1">{item.salePrice.toLocaleString()}</span>
                        <span className="font-bold text-brand-primary">{discountedPrice.toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-brand-primary">{item.salePrice.toLocaleString()}</span>
                    )}
                    {item.isTracked && <span className={cn('text-[10px] font-semibold', outOfStock ? 'text-red-500' : 'text-slate-400')}>{available ?? 0} {item.unitOfMeasure}</span>}
                  </div>
                  {/* Explicit either way — not every product has a discount, and a bare
                      price with no badge could otherwise read as "not checked yet" rather
                      than "confirmed, no discount." */}
                  <p className="text-[10px] mt-0.5 font-medium text-slate-400">
                    {discountedPrice !== null ? t('checkout.discountApplied') : t('checkout.noDiscount')}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 h-fit lg:sticky lg:top-4">
        <p className="text-sm font-bold text-slate-900">{t('checkout.cart')}</p>

        {shortages.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {t('checkout.stockShortage')}</p>
            {shortages.map((s) => <p key={s.itemId} className="text-xs text-red-500">{s.name}: {t('checkout.available')} {s.available}, {t('checkout.requested')} {s.requested}</p>)}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('checkout.emptyCart')}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.map((line) => {
              const available = line.isTracked ? stockFor(line.itemId) : null;
              const overStock = line.isTracked && available !== null && line.quantity > available;
              // No discount math here — discountedUnitPrice was already resolved once, at
              // add-to-cart time (same figure the product tile showed). This is just
              // quantity × a plain stored price, same as any non-discounted line.
              const hasDiscount = line.discountedUnitPrice !== null && line.discountedUnitPrice !== undefined;
              const lineSubtotal = round2(line.quantity * line.unitPrice);
              const lineTotal = round2(line.quantity * (hasDiscount ? line.discountedUnitPrice! : line.unitPrice));
              const autoDiscount = round2(lineSubtotal - lineTotal);
              return (
                <div key={line.itemId} className="border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-800 truncate flex-1">{line.name}</p>
                    <button onClick={() => removeLine(line.itemId)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateLine(line.itemId, { quantity: Math.max(1, line.quantity - 1) })} className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm w-6 text-center">{line.quantity}</span>
                      <button onClick={() => updateLine(line.itemId, { quantity: line.quantity + 1 })} className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                    </div>
                    {autoDiscount > 0 ? (
                      <span className="text-sm text-right">
                        <span className="line-through text-slate-400 mr-1.5">{lineSubtotal.toLocaleString()}</span>
                        <span className="font-semibold text-slate-700">{lineTotal.toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-700">{lineTotal.toLocaleString()}</span>
                    )}
                  </div>
                  {autoDiscount > 0 && (
                    <p className="text-[10px] text-emerald-600 text-right">-{autoDiscount.toLocaleString()} {t('checkout.itemDiscounts')}</p>
                  )}
                  {overStock && <p className="text-[10px] text-red-500 mt-0.5">{t('checkout.stockShortage')}: {available} {t('checkout.available')}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <select value={cartDiscountType} onChange={(e) => setCartDiscountType(e.target.value as any)} className="h-8 border border-slate-200 rounded px-1.5 text-xs">
            <option value="none">{t('checkout.cartDiscount')}</option>
            <option value="percentage">%</option>
            <option value="fixed">{t('checkout.fixedAmount')}</option>
          </select>
          {cartDiscountType !== 'none' && (
            <input type="number" value={cartDiscountValue} onChange={(e) => setCartDiscountValue(e.target.value)} className="h-8 flex-1 border border-slate-200 rounded px-2 text-xs" />
          )}
        </div>
        <div className="space-y-1 relative">
          {appliedPromo ? (
            <div className="flex items-center justify-between h-8 px-2 rounded bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">{t('checkout.promoApplied', { code: appliedPromo.code })}</span>
              <button onClick={clearPromoCode} className="text-emerald-500 hover:text-emerald-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <input value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); setShowCodesList(false); }} placeholder={t('checkout.promoCode')}
                  className="h-8 flex-1 border border-slate-200 rounded px-2 text-xs" />
                <button onClick={() => applyPromoCode()} disabled={!promoCode.trim() || checkingPromo}
                  className="h-8 px-3 rounded bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-40">
                  {checkingPromo ? '…' : t('checkout.applyPromo')}
                </button>
              </div>
              <button type="button" onClick={() => setShowCodesList((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline">
                <Tag className="h-3 w-3" /> {t('checkout.viewActiveCodes')} <ChevronDown className={cn('h-3 w-3 transition-transform', showCodesList && 'rotate-180')} />
              </button>
              {(showCodesList || (promoCode.trim().length > 0 && promoMatches.length > 0)) && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {(promoCode.trim() ? promoMatches : activeCodes).length === 0 ? (
                    <p className="text-[11px] text-slate-400 px-3 py-2">{t('checkout.noActiveCodes')}</p>
                  ) : (
                    (promoCode.trim() ? promoMatches : activeCodes).map((c) => (
                      <button key={c._id} type="button"
                        onClick={() => { setPromoCode(c.code); setShowCodesList(false); applyPromoCode(c.code); }}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50">
                        <span className="font-mono font-semibold text-slate-700">{c.code}</span>
                        <span className="text-slate-500">{c.discountType === 'percentage' ? `${c.discountValue}%` : c.discountValue} {t('checkout.off')}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
          {promoError && <p className="text-[10px] text-red-500">{promoError}</p>}
        </div>

        <div className="space-y-1">
          {appliedVoucher ? (
            <div className="flex items-center justify-between h-8 px-2 rounded bg-amber-50 border border-amber-200">
              <span className="text-xs font-semibold text-amber-700">{t('checkout.voucherApplied', { code: appliedVoucher.code })}</span>
              <button onClick={clearVoucher} className="text-amber-500 hover:text-amber-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(''); }} placeholder={t('checkout.voucherCode')}
                className="h-8 flex-1 border border-slate-200 rounded px-2 text-xs" />
              <button onClick={applyVoucher} disabled={!voucherCode.trim() || checkingVoucher}
                className="h-8 px-3 rounded bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-40">
                {checkingVoucher ? '…' : t('checkout.applyVoucher')}
              </button>
            </div>
          )}
          {voucherError && <p className="text-[10px] text-red-500">{voucherError}</p>}
        </div>

        <div className="space-y-1 text-sm pt-1 border-t border-slate-100">
          <div className="flex justify-between text-slate-500"><span>{t('checkout.subtotal')}</span><span>{totals.subtotal.toLocaleString()}</span></div>
          {totals.autoDiscountTotal > 0 && <div className="flex justify-between text-slate-500"><span>{t('checkout.itemDiscounts')}</span><span>-{totals.autoDiscountTotal.toLocaleString()}</span></div>}
          {totals.lineDiscountTotal > 0 && <div className="flex justify-between text-slate-500"><span>{t('checkout.lineDiscount')}</span><span>-{totals.lineDiscountTotal.toLocaleString()}</span></div>}
          {totals.cartDiscountAmount > 0 && <div className="flex justify-between text-slate-500"><span>{t('checkout.cartDiscount')}</span><span>-{totals.cartDiscountAmount.toLocaleString()}</span></div>}
          {totals.taxTotal > 0 && <div className="flex justify-between text-slate-500"><span>{t('checkout.tax')}</span><span>{totals.taxTotal.toLocaleString()}</span></div>}
          {voucherAmount > 0 && <div className="flex justify-between text-amber-600"><span>{t('checkout.voucher')}</span><span>-{voucherAmount.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-slate-900 text-base"><span>{t('checkout.total')}</span><span>{amountDue.toLocaleString()}</span></div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('checkout.payment')}</p>
          {payments.map((p, idx) => {
            const isSplit = payments.length > 1;
            const change = p.method === 'cash' && p.cashTendered ? round2(Math.max(0, p.cashTendered - (p.amount || 0))) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <select value={p.method} onChange={(e) => updatePaymentField(idx, { method: e.target.value as PaymentMethod, cashTendered: undefined, phoneNumber: undefined, reference: undefined })}
                    className="h-8 border border-slate-200 rounded px-1.5 text-xs">
                    <option value="cash">{t('checkout.cash')}</option>
                    <option value="card">{t('checkout.card')}</option>
                    <option value="mpesa">{t('checkout.mpesa')}</option>
                  </select>
                  {isSplit ? (
                    <input type="number" value={p.amount || ''} onChange={(e) => updatePaymentField(idx, { amount: Number(e.target.value) || 0 })} className="h-8 flex-1 border border-slate-200 rounded px-2 text-xs" />
                  ) : (
                    // Sole payment method — nothing to split, the full total always applies
                    // here automatically (kept in sync by the effect above), so there's no
                    // amount to type. What's left below is only ever payment-specific detail.
                    <span className="h-8 flex-1 flex items-center px-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded border border-slate-100">{p.amount.toLocaleString()}</span>
                  )}
                  {isSplit && <button onClick={() => removePayment(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
                {p.method === 'cash' && (
                  <div className="flex items-center gap-1.5 pl-1">
                    <input type="number" value={p.cashTendered || ''} onChange={(e) => updatePaymentField(idx, { cashTendered: Number(e.target.value) || undefined })}
                      placeholder={t('checkout.cashTendered')} className="h-7 flex-1 border border-slate-200 rounded px-2 text-xs" />
                    {change > 0 && <span className="text-[11px] font-semibold text-emerald-600 shrink-0">{t('checkout.changeDue')}: {change.toLocaleString()}</span>}
                  </div>
                )}
                {p.method === 'mpesa' && (
                  <div className="flex items-center gap-1.5 pl-1">
                    <input value={p.phoneNumber || ''} onChange={(e) => updatePaymentField(idx, { phoneNumber: e.target.value })}
                      placeholder={t('checkout.phoneNumber')} className="h-7 flex-1 border border-slate-200 rounded px-2 text-xs" />
                    <input value={p.reference || ''} onChange={(e) => updatePaymentField(idx, { reference: e.target.value })}
                      placeholder={t('checkout.mpesaReference')} className="h-7 flex-1 border border-slate-200 rounded px-2 text-xs" />
                  </div>
                )}
              </div>
            );
          })}
          {payments.length < ALL_PAYMENT_METHODS.length && (
            <button onClick={addPaymentMethod} className="text-xs text-brand-primary font-semibold flex items-center gap-1">
              <Plus className="h-3 w-3" /> {t('checkout.splitPayment')}
            </button>
          )}
          <p className={cn('text-xs text-right', balanced ? 'text-emerald-600' : 'text-slate-400')}>{paymentsTotal.toLocaleString()} / {amountDue.toLocaleString()}</p>
        </div>

        <button onClick={checkout} disabled={!cart.length || !balanced || submitting}
          className="w-full h-11 rounded-lg bg-brand-primary text-white text-sm font-bold disabled:opacity-40">
          {submitting ? t('common.saving') : t('checkout.completeSale')}
        </button>
      </div>
    </div>
  );
}
