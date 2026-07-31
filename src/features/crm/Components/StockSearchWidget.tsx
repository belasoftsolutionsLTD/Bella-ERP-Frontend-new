'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { useInventoryStockSearch } from '../Hooks/useCrmIntegrations';

export function StockSearchWidget() {
  const t = useTranslations('CRM');
  const [search, setSearch] = useState('');
  const { results, isLoading } = useInventoryStockSearch(search);

  return (
    <div className="rounded-xl border border-slate-200 p-3 space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('inventory.checkStock')}</p>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('inventory.searchPlaceholder')}
          className="w-full h-8 pl-8 pr-2 border border-slate-200 rounded-lg text-xs" />
      </div>
      {isLoading && <p className="text-xs text-slate-400">{t('common.loading')}</p>}
      {!isLoading && search && results.length === 0 && <p className="text-xs text-slate-400">{t('inventory.noResults')}</p>}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {results.map((item) => (
          <div key={item._id} className="flex items-center justify-between text-xs">
            <span className="text-slate-700 truncate">{item.name} <span className="text-slate-400 font-mono">({item.sku})</span></span>
            <span className={item.isTracked && (item.stock ?? 0) <= 0 ? 'text-red-500 font-semibold' : 'text-slate-500'}>
              {item.isTracked ? `${item.stock ?? 0} ${item.unitOfMeasure}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
