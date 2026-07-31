'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { useCompanies } from '../Hooks/useCompanies';
import { CompanyFormModal } from './CompanyFormModal';

export function CompaniesTab() {
  const t = useTranslations('CRM');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const { companies, isLoading } = useCompanies({ search });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('companies.searchPlaceholder')}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
          <Plus className="h-4 w-4" /> {t('companies.addCompany')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : companies.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('companies.noCompanies')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((c) => (
            <Link key={c._id} href={`/${locale}/crm/companies/${c._id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-primary/40 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-2"><Building2 className="h-4 w-4" /></div>
              <p className="font-semibold text-sm text-slate-900">{c.name}</p>
              {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
            </Link>
          ))}
        </div>
      )}

      {showForm && <CompanyFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
