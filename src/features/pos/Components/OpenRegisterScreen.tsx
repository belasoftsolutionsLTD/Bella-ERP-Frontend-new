'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRegisterSession } from '../Hooks/usePosRegister';
import { usePosLocations } from '../Hooks/usePosLocations';

export function OpenRegisterScreen() {
  const t = useTranslations('POS');
  const { userData } = useAuth();
  const { locations } = usePosLocations();
  const { openRegister } = useCurrentRegisterSession();
  const [locationId, setLocationId] = useState('');
  const [openingFloat, setOpeningFloat] = useState('');
  const [opening, setOpening] = useState(false);

  const submit = () => {
    if (!locationId) return;
    setOpening(true);
    openRegister(locationId, Number(openingFloat) || 0)?.finally(() => setOpening(false));
  };

  return (
    <div className="max-w-sm mx-auto py-16 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
        <Store className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t('register.openRegister')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('register.openRegisterHint')}</p>
      </div>
      <div className="space-y-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('register.cashier')}</label>
          <p className="h-10 flex items-center px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">{userData?.name}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('register.location')}</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="h-10 border border-slate-200 rounded-lg px-3 text-sm">
            <option value="">{t('common.select')}</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('register.openingFloat')}</label>
          <input type="number" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} placeholder="0.00"
            className="h-10 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
      </div>
      <button onClick={submit} disabled={opening || !locationId} className="w-full h-11 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-50">
        {opening ? t('common.saving') : t('register.openRegister')}
      </button>
    </div>
  );
}
