'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useCompanies, useCompany } from '../Hooks/useCompanies';
import { INDUSTRIES } from '../schemas';
import type { Company } from '../types';

// Same edit-mode-via-optional-prop pattern as ContactFormModal.
export function CompanyFormModal({ company, onClose }: { company?: Company; onClose: () => void }) {
  const t = useTranslations('CRM');
  const isEdit = !!company;
  const { createCompany } = useCompanies();
  const { updateCompany } = useCompany(company?._id ?? null);
  const [name, setName] = useState(company?.name ?? '');
  const [industry, setIndustry] = useState(company?.industry ?? '');
  const [industryIsOther, setIndustryIsOther] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), industry: industry.trim() };
    const action = isEdit ? updateCompany(payload) : createCompany(payload);
    action?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{isEdit ? t('companies.editCompany') : t('companies.addCompany')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('companies.name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('companies.industry')}</label>
          <select
            value={industryIsOther ? 'Other' : industry}
            onChange={(e) => {
              if (e.target.value === 'Other') { setIndustryIsOther(true); setIndustry(''); }
              else { setIndustryIsOther(false); setIndustry(e.target.value); }
            }}
            className="h-9 border border-slate-200 rounded-lg px-2 text-sm"
          >
            <option value="">{t('common.select')}</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            <option value="Other">{t('companies.otherIndustry')}</option>
          </select>
          {industryIsOther && (
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={t('companies.industryPlaceholder')}
              className="h-9 border border-slate-200 rounded-lg px-3 text-sm mt-1.5" />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
