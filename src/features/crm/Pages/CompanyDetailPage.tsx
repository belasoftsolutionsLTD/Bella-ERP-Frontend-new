'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Pencil, Building2, Users, Briefcase } from 'lucide-react';
import { useCompany } from '../Hooks/useCompanies';
import { CompanyFormModal } from '../Components/CompanyFormModal';

export function CompanyDetailPage({ id }: { id: string }) {
  const t = useTranslations('CRM');
  const locale = useLocale();
  const { company, isLoading } = useCompany(id);
  const [showEdit, setShowEdit] = useState(false);

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-primary/40" /></div>;
  if (!company) return <div className="p-6 text-sm text-slate-400">{t('common.notFound')}</div>;

  const openDeals = (company.deals ?? []).filter((d) => d.status === 'open');
  const wonValue = (company.deals ?? []).filter((d) => d.status === 'won').reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <Link href={`/${locale}/crm?tab=companies`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {t('nav.companies')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{company.name}</h1>
              {company.industry && <p className="text-sm text-slate-500">{company.industry}</p>}
            </div>
          </div>
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
          <p className="text-lg font-bold text-slate-900">{company.contacts?.length ?? 0}</p>
          <p className="text-xs text-slate-500">{t('companies.contactsCount')}</p>
        </div>
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
          <p className="text-lg font-bold text-slate-900">{openDeals.length}</p>
          <p className="text-xs text-slate-500">{t('companies.openDeals')}</p>
        </div>
        <div className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3">
          <p className="text-lg font-bold text-emerald-600">{wonValue.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{t('companies.wonValue')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('nav.contacts')}</h2>
          {(company.contacts?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">{t('contacts.noContacts')}</p>
          ) : (
            <div className="space-y-2">
              {company.contacts!.map((c) => (
                <Link key={c._id} href={`/${locale}/crm/contacts/${c._id}`} className="block text-sm text-brand-primary hover:underline">
                  {c.firstName} {c.lastName} {c.email && <span className="text-slate-400">— {c.email}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {t('nav.pipeline')}</h2>
          {(company.deals?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">{t('deals.noDeals')}</p>
          ) : (
            <div className="space-y-2">
              {company.deals!.map((d) => (
                <div key={d._id} className="text-sm">
                  <p className="text-slate-800 truncate">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.value.toLocaleString()} · <span className="capitalize">{d.status}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && <CompanyFormModal company={company} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
