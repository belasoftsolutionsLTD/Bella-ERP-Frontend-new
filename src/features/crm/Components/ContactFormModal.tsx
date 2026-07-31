'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useContacts, useContact } from '../Hooks/useContacts';
import { useCompanies } from '../Hooks/useCompanies';
import type { Contact } from '../types';

// Edit mode is triggered by passing an existing `contact` — same modal, same fields,
// just prefilled and calling updateContact instead of createContact. Avoids a second
// near-identical form component for what's otherwise the exact same UI.
export function ContactFormModal({ contact, onClose }: { contact?: Contact; onClose: () => void }) {
  const t = useTranslations('CRM');
  const isEdit = !!contact;
  const { createContact } = useContacts();
  const { updateContact } = useContact(contact?._id ?? null);
  const { companies, createCompany } = useCompanies();
  const [firstName, setFirstName] = useState(contact?.firstName ?? '');
  const [lastName, setLastName] = useState(contact?.lastName ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [companyId, setCompanyId] = useState(contact?.companyId ?? '');
  const [companyIsOther, setCompanyIsOther] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [source, setSource] = useState(contact?.source ?? '');
  const [sourceWebsite, setSourceWebsite] = useState(contact?.sourceWebsite ?? '');
  const [sourceEventName, setSourceEventName] = useState(contact?.sourceEventName ?? '');
  const [sourceEventVenue, setSourceEventVenue] = useState(contact?.sourceEventVenue ?? '');
  const [sourceEventDate, setSourceEventDate] = useState(contact?.sourceEventDate ?? '');
  const [saving, setSaving] = useState(false);

  const SOURCE_OPTIONS = ['website', 'referral', 'cold_outreach', 'event', 'social_media', 'walk_in', 'other'] as const;
  const sourceKey = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

  const save = async () => {
    if (!firstName.trim()) return;
    // "Other" lets a contact be created without first having to go set up a Company
    // record separately — we create that company inline, then link its new id, rather
    // than leaving the Company dropdown empty until someone pre-populates it.
    if (companyIsOther && !newCompanyName.trim()) return;
    if (source === 'website' && !sourceWebsite.trim()) return;
    if (source === 'event' && !sourceEventName.trim()) return;
    setSaving(true);
    try {
      let resolvedCompanyId = companyId || undefined;
      if (companyIsOther) {
        const res: any = await createCompany({ name: newCompanyName.trim() });
        resolvedCompanyId = res?.data?._id;
      }
      const payload = {
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), companyId: resolvedCompanyId,
        source: source || undefined,
        sourceWebsite: source === 'website' ? sourceWebsite.trim() : undefined,
        sourceEventName: source === 'event' ? sourceEventName.trim() : undefined,
        sourceEventVenue: source === 'event' ? sourceEventVenue.trim() || undefined : undefined,
        sourceEventDate: source === 'event' ? sourceEventDate || undefined : undefined,
      };
      if (isEdit) await updateContact(payload);
      else await createContact(payload);
      setSaving(false);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{isEdit ? t('contacts.editContact') : t('contacts.addContact')}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('contacts.firstName')}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('contacts.lastName')}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('contacts.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('contacts.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs text-slate-500">{t('contacts.companyOptional')}</label>
            <select
              value={companyIsOther ? 'Other' : companyId}
              onChange={(e) => {
                if (e.target.value === 'Other') { setCompanyIsOther(true); setCompanyId(''); }
                else { setCompanyIsOther(false); setCompanyId(e.target.value); }
              }}
              className="h-9 border border-slate-200 rounded-lg px-2 text-sm"
            >
              <option value="">{t('common.select')}</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              <option value="Other">{t('contacts.otherCompany')}</option>
            </select>
            <p className="text-[11px] text-slate-400">{t('contacts.companyOptionalHint')}</p>
            {companyIsOther && (
              <input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder={t('contacts.newCompanyPlaceholder')}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm mt-1.5" />
            )}
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs text-slate-500">{t('contacts.source')}</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 border border-slate-200 rounded-lg px-2 text-sm">
              <option value="">{t('common.select')}</option>
              {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{t(`contacts.sourceValue.${sourceKey(s)}`)}</option>)}
            </select>
            {source === 'website' && (
              <input value={sourceWebsite} onChange={(e) => setSourceWebsite(e.target.value)} placeholder={t('contacts.sourceWebsitePlaceholder')}
                className="h-9 border border-slate-200 rounded-lg px-3 text-sm mt-1.5" />
            )}
            {source === 'event' && (
              <div className="space-y-1.5 mt-1.5">
                <input value={sourceEventName} onChange={(e) => setSourceEventName(e.target.value)} placeholder={t('contacts.sourceEventName')}
                  className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm" />
                <div className="flex gap-1.5">
                  <input value={sourceEventVenue} onChange={(e) => setSourceEventVenue(e.target.value)} placeholder={t('contacts.sourceEventVenue')}
                    className="h-9 flex-1 border border-slate-200 rounded-lg px-3 text-sm" />
                  <input type="date" value={sourceEventDate} onChange={(e) => setSourceEventDate(e.target.value)}
                    className="h-9 border border-slate-200 rounded-lg px-2 text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5">{t('common.cancel')}</button>
          <button onClick={save} disabled={saving || !firstName.trim() || (companyIsOther && !newCompanyName.trim()) || (source === 'website' && !sourceWebsite.trim()) || (source === 'event' && !sourceEventName.trim())} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-50">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
