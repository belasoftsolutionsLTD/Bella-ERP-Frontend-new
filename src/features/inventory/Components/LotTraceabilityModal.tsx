'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Search } from 'lucide-react';
import { useItemLots, useLotTrace } from '../Hooks/useInventoryLots';
import type { InventoryItem } from '../types';

export function LotTraceabilityModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const t = useTranslations('Inventory');
  const { lots } = useItemLots(item._id);
  const [tracing, setTracing] = useState<string | null>(null);
  const { trace } = useLotTrace(item._id, tracing);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('lots.title')} — {item.name}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        {lots.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('lots.noLots')}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {lots.map((l) => (
              <div key={l._id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-mono text-slate-700">{l.lotNumber}</p>
                  <p className="text-xs text-slate-400">{l.location?.name} · {l.quantityRemaining} {item.unitOfMeasure}
                    {l.expiryDate && <span className={l.isExpired ? 'text-red-500 font-semibold' : ''}> · {t('lots.expiryDate')}: {new Date(l.expiryDate).toLocaleDateString()}{l.isExpired ? ` (${t('lots.expired')})` : ''}</span>}
                  </p>
                </div>
                <button onClick={() => setTracing(l.lotNumber)} className="flex items-center gap-1 text-xs text-brand-primary hover:underline shrink-0">
                  <Search className="h-3 w-3" /> {t('lots.traceLot')}
                </button>
              </div>
            ))}
          </div>
        )}

        {tracing && trace && (
          <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('lots.movements')} — {tracing}</p>
            {trace.movements.length === 0 ? (
              <p className="text-xs text-slate-400">{t('lots.noLots')}</p>
            ) : (
              <div className="space-y-1">
                {trace.movements.map((m) => (
                  <div key={m._id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{new Date(m.createdAt).toLocaleString()} · {m.movementType} · {m.location?.name}</span>
                    <span className={m.quantityChange > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
