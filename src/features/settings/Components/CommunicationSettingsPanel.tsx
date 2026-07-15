'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { toast } from 'sonner';

interface CommSettings {
  emailProvider?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpFrom?: string;
  notifyOnLeave?: boolean;
  notifyOnPayroll?: boolean;
  notifyOnAppraisal?: boolean;
}

export function CommunicationSettingsPanel() {
  const [form, setForm] = useState<CommSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/config/communication-settings`,
      showToast: false,
      thenFn: (r) => setForm(r.data ?? {}),
      catchFn: () => {},
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof CommSettings, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const save = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/config/communication-settings`,
      method: 'PUT',
      data: form,
      thenFn: () => toast.success('Communication settings saved.'),
      catchFn: () => toast.error('Failed to save.'),
      finallyFn: () => setSaving(false),
    });
  };

  if (loading) return <div className="p-8 text-sm text-foreground/50">Loading…</div>;

  return (
    <div className="rounded-xl border bg-white divide-y">
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Communication Settings</h3>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Email Provider" value={form.emailProvider ?? ''} onChange={(v) => set('emailProvider', v)} placeholder="e.g. smtp, sendgrid" />
        <Field label="SMTP Host" value={form.smtpHost ?? ''} onChange={(v) => set('smtpHost', v)} placeholder="smtp.example.com" />
        <Field label="SMTP Port" value={form.smtpPort ?? ''} onChange={(v) => set('smtpPort', v)} placeholder="587" />
        <Field label="SMTP Username" value={form.smtpUser ?? ''} onChange={(v) => set('smtpUser', v)} placeholder="user@example.com" />
        <Field label="From Address" value={form.smtpFrom ?? ''} onChange={(v) => set('smtpFrom', v)} placeholder="noreply@school.com" />
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Notification Triggers</p>
        <Toggle label="Notify employee on leave approval/rejection" checked={form.notifyOnLeave ?? true} onChange={(v) => set('notifyOnLeave', v)} />
        <Toggle label="Notify employee when payslip is generated" checked={form.notifyOnPayroll ?? true} onChange={(v) => set('notifyOnPayroll', v)} />
        <Toggle label="Notify employee when appraised" checked={form.notifyOnAppraisal ?? true} onChange={(v) => set('notifyOnAppraisal', v)} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-foreground/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 border border-brand-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm">{label}</span>
    </label>
  );
}
