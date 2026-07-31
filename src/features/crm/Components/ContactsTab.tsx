'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useContacts } from '../Hooks/useContacts';
import { ContactFormModal } from './ContactFormModal';

export function ContactsTab() {
  const t = useTranslations('CRM');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const { contacts, isLoading } = useContacts({ search });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('contacts.searchPlaceholder')}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90">
          <Plus className="h-4 w-4" /> {t('contacts.addContact')}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">{t('contacts.noContacts')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">{t('contacts.name')}</th>
                <th className="px-4 py-2.5">{t('contacts.company')}</th>
                <th className="px-4 py-2.5">{t('contacts.email')}</th>
                <th className="px-4 py-2.5">{t('contacts.phone')}</th>
                <th className="px-4 py-2.5">{t('contacts.source')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/${locale}/crm/contacts/${c._id}`} className="font-medium text-brand-primary hover:underline">{c.firstName} {c.lastName}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{c.company?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.email || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.phone || '—'}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">{t(`contacts.sourceValue.${c.source}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ContactFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
