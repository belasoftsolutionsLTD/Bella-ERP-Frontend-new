'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { usePromoCodes, useVouchers, usePosStaffAccess } from '../Hooks/usePosConfig';
import { usePosLocations } from '../Hooks/usePosLocations';

function PromoCodesPanel() {
  const t = useTranslations('POS');
  const { promoCodes, createCode, deleteCode } = usePromoCodes();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  const add = () => {
    if (!code.trim() || !discountValue) return;
    createCode({ code: code.trim(), discountType, discountValue: Number(discountValue) });
    setCode(''); setDiscountValue('');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.promoCodes')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('settings.code')} className="h-9 border border-slate-200 rounded-lg px-3 text-sm uppercase" />
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
          <option value="percentage">%</option>
          <option value="fixed">{t('checkout.fixedAmount')}</option>
        </select>
        <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={t('settings.value')} className="h-9 w-24 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={add} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {t('common.add')}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {promoCodes.map((c) => (
          <span key={c._id} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {c.code} — {c.discountType === 'percentage' ? `${c.discountValue}%` : c.discountValue}
            <button onClick={() => deleteCode(c._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function VouchersPanel() {
  const t = useTranslations('POS');
  const { vouchers, createVoucher, deleteVoucher } = useVouchers();
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const add = () => {
    if (!code.trim() || !value) return;
    createVoucher({ code: code.trim(), value: Number(value), expiresAt: expiresAt || undefined });
    setCode(''); setValue(''); setExpiresAt('');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.vouchers')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('settings.code')} className="h-9 border border-slate-200 rounded-lg px-3 text-sm uppercase" />
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('settings.value')} className="h-9 w-24 border border-slate-200 rounded-lg px-3 text-sm" />
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        <button onClick={add} className="h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> {t('common.add')}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {vouchers.map((v) => (
          <span key={v._id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${v.redeemedAt ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
            {v.code} — {v.value.toLocaleString()}{v.redeemedAt ? ` (${t('settings.redeemed')})` : ''}
            <button onClick={() => deleteVoucher(v._id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function StaffLocationsPanel() {
  const t = useTranslations('POS');
  const { staff, setLocations } = usePosStaffAccess();
  const { locations } = usePosLocations();

  const toggle = (userId: string, current: string[], locationId: string) => {
    const next = current.includes(locationId) ? current.filter((id) => id !== locationId) : [...current, locationId];
    setLocations(userId, next);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('settings.staffAccess')}</p>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {staff.map((u) => (
          <div key={u._id} className="px-4 py-3">
            <p className="text-sm text-slate-800">{u.name}</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {locations.map((l) => (
                <label key={l._id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input type="checkbox" checked={u.posLocationIds.includes(l._id)} onChange={() => toggle(u._id, u.posLocationIds, l._id)} />
                  {l.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="space-y-6">
      <PromoCodesPanel />
      <VouchersPanel />
      <StaffLocationsPanel />
    </div>
  );
}
