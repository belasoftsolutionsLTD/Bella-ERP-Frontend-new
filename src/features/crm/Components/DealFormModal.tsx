'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useDeals } from '../Hooks/useDeals';
import { useContacts } from '../Hooks/useContacts';
import type { Pipeline } from '../types';

export function DealFormModal({ pipeline, defaultContactId, onClose }: { pipeline: Pipeline; defaultContactId?: string; onClose: () => void }) {
  const t = useTranslations('CRM');
  const { createDeal } = useDeals({ pipelineId: pipeline._id });
  const { contacts } = useContacts();
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState(defaultContactId || '');
  const [value, setValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!title.trim() || !contactId) return;
    setSaving(true);
    createDeal({ title: title.trim(), contactId, pipelineId: pipeline._id, value: Number(value) || 0, expectedCloseDate: expectedCloseDate || undefined })
      ?.then(() => { setSaving(false); onClose(); }).catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{t('deals.addDeal')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('deals.title')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t('deals.contact')}</label>
          <select value={contactId} onChange={(e) => setContactId(e.target.value)} disabled={!!defaultContactId} className="h-9 border border-slate-200 rounded-lg px-2 text-sm disabled:bg-slate-50">
            <option value="">{t('common.select')}</option>
            {contacts.map((c) => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('deals.value')}</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('deals.expectedCloseDate')}</label>
            <input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
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
