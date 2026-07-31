'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useCurrentRegisterSession } from '../Hooks/usePosRegister';

export function CloseRegisterModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('POS');
  const { closeRegister } = useCurrentRegisterSession();
  const [closingCount, setClosingCount] = useState('');
  const [result, setResult] = useState<{ expectedCash: number; closingCount: number; variance: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = () => {
    setSaving(true);
    closeRegister(Number(closingCount) || 0)
      ?.then((res: any) => setResult(res?.data ?? null))
      .finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('register.closeRegister')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        {!result ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t('register.closingCount')}</label>
              <input autoFocus type="number" value={closingCount} onChange={(e) => setClosingCount(e.target.value)} placeholder="0.00"
                className="h-10 border border-slate-200 rounded-lg px-3 text-sm" />
            </div>
            <button onClick={submit} disabled={saving} className="w-full h-10 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-50">
              {saving ? t('common.saving') : t('register.closeRegister')}
            </button>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t('register.expectedCash')}</span><span className="font-semibold text-slate-800">{result.expectedCash.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t('register.closingCount')}</span><span className="font-semibold text-slate-800">{result.closingCount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">{t('register.variance')}</span>
              <span className={`font-bold ${result.variance === 0 ? 'text-emerald-600' : result.variance > 0 ? 'text-sky-600' : 'text-red-600'}`}>
                {result.variance > 0 ? '+' : ''}{result.variance.toFixed(2)}
              </span>
            </div>
            <button onClick={onClose} className="w-full h-10 mt-2 rounded-lg bg-slate-800 text-white text-sm font-semibold">{t('common.close')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
