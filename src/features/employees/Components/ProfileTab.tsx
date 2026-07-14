'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Loader2, Users } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Employee } from '../Hooks/useEmployees';

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-foreground/50 mb-0.5">{label}</p>
    <p className="text-sm font-medium">{value || '—'}</p>
  </div>
);

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female', preferNotToSay: 'Prefer not to say' };
const MARITAL_LABEL: Record<string, string> = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed' };

interface EmergencyContact { id: string; name: string; relationship?: string | null; phone: string; email?: string | null }

function EmergencyContactsSection({ employeeId, contacts, isHR, onChanged }: {
  employeeId: string; contacts: EmergencyContact[]; isHR: boolean; onChanged: (next: EmergencyContact[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const save = (next: EmergencyContact[]) => {
    setSaving(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees/${employeeId}/emergency-contacts`, method: 'PATCH', data: { emergencyContacts: next },
      thenFn: (r) => onChanged(r.data ?? next), finallyFn: () => setSaving(false),
    });
  };

  const add = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    const next = [...contacts, { id: '', name: form.name, relationship: form.relationship || null, phone: form.phone, email: form.email || null }];
    save(next);
    setForm({ name: '', relationship: '', phone: '', email: '' });
    setShowForm(false);
  };

  const remove = (id: string) => save(contacts.filter(c => c.id !== id));

  const inp = 'h-9 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary';

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-1.5"><Users className="h-4 w-4 text-rose-500" /> Emergency Contacts</h3>
        {isHR && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
      {showForm && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" className={inp} />
            <input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Relationship" className={inp} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone *" className={inp} />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className={inp} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={saving} className="flex items-center gap-1.5 h-8 px-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2">Cancel</button>
          </div>
        </div>
      )}
      {contacts.length === 0 ? (
        <p className="text-sm text-foreground/40">No emergency contacts on file.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="relative rounded-lg border p-3">
              {isHR && (
                <button onClick={() => remove(c.id)} className="absolute top-1.5 right-1.5 h-6 w-6 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <p className="text-sm font-medium pr-6">{c.name}</p>
              <p className="text-xs text-foreground/50">{c.relationship || '—'}</p>
              <p className="text-xs text-foreground/50">{c.phone}</p>
              {c.email && <p className="text-xs text-foreground/50">{c.email}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileTab({ employee }: { employee: Employee }) {
  const { isHR } = useAuth();
  const t = useTranslations('Employees');
  const tc = useTranslations('Common');
  const hireDate = employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString('en-KE') : '—';
  const contractEnd = employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('en-KE') : '—';
  const passportExpiry = employee.passportExpiryDate ? new Date(employee.passportExpiryDate).toLocaleDateString('en-KE') : '—';
  const nok = (employee as any).nextOfKin;
  const address = employee.address;
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(employee.emergencyContacts ?? []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border bg-white p-5">
        <Field label={t('fullName')} value={employee.fullName} />
        {(employee.firstName || employee.lastName) && <Field label="First Name" value={employee.firstName} />}
        {(employee.firstName || employee.lastName) && <Field label="Last Name" value={employee.lastName} />}
        {employee.preferredName && <Field label="Preferred Name" value={employee.preferredName} />}
        <Field label={t('staffNumber')} value={employee.staffNumber} />
        <Field label={t('nationalId')} value={employee.nationalId} />
        <Field label={tc('email')} value={employee.email} />
        <Field label={tc('phone')} value={employee.phone} />
        <Field label={tc('department')} value={employee.department} />
        <Field label={tc('designation')} value={employee.designation} />
        <Field label={t('employmentType')} value={employee.employmentType} />
        <Field label={t('dateOfHire')} value={hireDate} />
        <Field label={t('contractEndDate')} value={contractEnd} />
        {employee.gender && <Field label="Gender" value={GENDER_LABEL[employee.gender] ?? employee.gender} />}
        {employee.maritalStatus && <Field label="Marital Status" value={MARITAL_LABEL[employee.maritalStatus] ?? employee.maritalStatus} />}
        {employee.nationality && <Field label="Nationality" value={employee.nationality} />}
        {employee.passportNumber && <Field label="Passport Number" value={employee.passportNumber} />}
        {employee.passportNumber && <Field label="Passport Expiry" value={passportExpiry} />}
      </div>

      {address && (address.street || address.city || address.state || address.country || address.postalCode) && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold mb-3">Address</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Street" value={address.street} />
            <Field label="City" value={address.city} />
            <Field label="State / County" value={address.state} />
            <Field label="Country" value={address.country} />
            <Field label="Postal Code" value={address.postalCode} />
          </div>
        </div>
      )}

      {nok && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold mb-3">{t('nextOfKin')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label={t('nokName')} value={nok.name} />
            <Field label={t('nokRelationship')} value={nok.relationship} />
            <Field label={t('nokPhone')} value={nok.phone} />
            <Field label="NOK National ID" value={nok.nationalId} />
            <Field label="NOK Email" value={nok.email} />
          </div>
        </div>
      )}

      <EmergencyContactsSection employeeId={employee._id} contacts={emergencyContacts} isHR={isHR} onChanged={setEmergencyContacts} />
    </div>
  );
}
