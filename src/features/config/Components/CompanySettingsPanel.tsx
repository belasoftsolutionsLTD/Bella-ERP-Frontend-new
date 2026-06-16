'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Upload, Building2, FileText, Palette, Check, MapPin, Navigation } from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { toast } from 'sonner';

interface CompanySettings {
  companyName?: string;
  mission?: string;
  vision?: string;
  coreValues?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  letterheadPath?: string;
  termsPath?: string;
  workStartTime?: string;
  workEndTime?: string;
  primaryColor?: string;
  gradientEndColor?: string;
  gradientEnabled?: boolean;
  officeLatitude?: string;
  officeLongitude?: string;
  officeRadiusMeters?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

const PRESET_COLORS = [
  '#0A1931', '#1a56db', '#7e3af2', '#e02424',
  '#057a55', '#0694a2', '#c27803', '#1f2937',
  '#9b1c1c', '#5521b5', '#03543f', '#1e429f',
];

function hexToRgbChannels(hex: string) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function CompanySettingsPanel() {
  const [form, setForm] = useState<CompanySettings>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const logoRef       = useRef<HTMLInputElement>(null);
  const letterheadRef = useRef<HTMLInputElement>(null);
  const termsRef      = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<{ data: CompanySettings }>({
      url: `${API_BASE_URL}/config/company-settings`,
      showToast: false,
      thenFn: (r) => {
        const data = r.data ?? {};
        setForm(data);
        if (data.logoPath) {
          // Bust cache on reload so we always see the latest
          setLogoPreviewUrl(`${API_BASE_URL}/config/company-logo?t=${Date.now()}`);
        }
      },
      catchFn: () => {},
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof CompanySettings>(key: K, val: CompanySettings[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Live-preview the chosen colors while the user is selecting
  const applyPreview = (primary: string, gradEnd: string) => {
    document.documentElement.style.setProperty('--color-primary', hexToRgbChannels(primary));
    document.documentElement.style.setProperty('--color-gradient-end', hexToRgbChannels(gradEnd));
  };

  const save = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/config/company-settings`,
      method: 'PUT',
      data: form,
      thenFn: () => {
        toast.success('Company settings saved.');
        // Persist the colors globally
        if (form.primaryColor) applyPreview(form.primaryColor, form.gradientEndColor || form.primaryColor);
      },
      catchFn: () => toast.error('Failed to save.'),
      finallyFn: () => setSaving(false),
    });
  };

  const uploadFile = async (field: 'logo' | 'letterhead' | 'terms', file: File) => {
    setUploading(field);
    const fd = new FormData();
    fd.append(field, file);
    const token = sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/config/company-settings/${field}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} uploaded.`);
        setForm((f) => ({ ...f, [`${field}Path`]: json.data?.path }));
        if (field === 'logo') {
          setLogoPreviewUrl(`${API_BASE_URL}/config/company-logo?t=${Date.now()}`);
        }
      } else {
        toast.error(json.message || 'Upload failed.');
      }
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="p-8 text-sm text-foreground/50">Loading…</div>;

  const primaryColor   = form.primaryColor   || '#0A1931';
  const gradEndColor   = form.gradientEndColor || '#C9A84C';
  const gradEnabled    = form.gradientEnabled ?? false;

  return (
    <div className="rounded-xl border bg-white divide-y">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Company Settings</h3>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Basic info */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Company Name" value={form.companyName ?? ''} onChange={(v) => set('companyName', v)} />
        <Field label="Email"        value={form.email ?? ''}       onChange={(v) => set('email', v)} />
        <Field label="Phone"        value={form.phone ?? ''}       onChange={(v) => set('phone', v)} />
        <Field label="Website"      value={form.website ?? ''}     onChange={(v) => set('website', v)} />
        <div className="md:col-span-2">
          <Field label="Address" value={form.address ?? ''} onChange={(v) => set('address', v)} />
        </div>
      </div>

      {/* Social media */}
      <div className="px-4 pb-1">
        <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Social Media</p>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Facebook URL"  value={form.facebook  ?? ''} onChange={(v) => set('facebook',  v)} placeholder="https://facebook.com/yourpage" />
        <Field label="Twitter / X"   value={form.twitter   ?? ''} onChange={(v) => set('twitter',   v)} placeholder="https://twitter.com/yourhandle" />
        <Field label="LinkedIn URL"  value={form.linkedin  ?? ''} onChange={(v) => set('linkedin',  v)} placeholder="https://linkedin.com/company/..." />
        <Field label="Instagram URL" value={form.instagram ?? ''} onChange={(v) => set('instagram', v)} placeholder="https://instagram.com/yourpage" />
        <Field label="YouTube URL"   value={form.youtube   ?? ''} onChange={(v) => set('youtube',   v)} placeholder="https://youtube.com/@yourchannel" />
        <Field label="TikTok URL"    value={form.tiktok    ?? ''} onChange={(v) => set('tiktok',    v)} placeholder="https://tiktok.com/@yourhandle" />
      </div>

      {/* Work schedule */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Work Start Time</label>
          <input type="time" value={form.workStartTime ?? '08:00'}
            onChange={(e) => set('workStartTime', e.target.value)}
            className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <p className="text-[10px] text-foreground/40">Employees are notified 15 min before this time to clock in</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Work End Time</label>
          <input type="time" value={form.workEndTime ?? '17:00'}
            onChange={(e) => set('workEndTime', e.target.value)}
            className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <p className="text-[10px] text-foreground/40">Employees are notified 15 min before this time to clock out</p>
        </div>
      </div>

      {/* Mission / Vision / Values */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextArea label="Mission Statement" value={form.mission ?? ''}    onChange={(v) => set('mission', v)}    rows={4} />
        <TextArea label="Vision Statement"  value={form.vision ?? ''}     onChange={(v) => set('vision', v)}     rows={4} />
        <TextArea label="Core Values"       value={form.coreValues ?? ''} onChange={(v) => set('coreValues', v)} rows={4} placeholder="One value per line" />
      </div>

      {/* ── Office Location (geofencing) ── */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Office Location &amp; Clock-In Geofence</h4>
        </div>
        <p className="text-xs text-foreground/50 mb-4">
          Employees must be within the set radius of these coordinates to clock in.
          Leave blank to disable geofencing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60">Office Latitude</label>
            <input
              type="number" step="any"
              value={form.officeLatitude ?? ''}
              onChange={(e) => set('officeLatitude', e.target.value)}
              placeholder="e.g. -1.2921"
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60">Office Longitude</label>
            <input
              type="number" step="any"
              value={form.officeLongitude ?? ''}
              onChange={(e) => set('officeLongitude', e.target.value)}
              placeholder="e.g. 36.8219"
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground/60">Allowed Radius (metres)</label>
            <input
              type="number" min="50" max="5000"
              value={form.officeRadiusMeters ?? '200'}
              onChange={(e) => set('officeRadiusMeters', e.target.value)}
              placeholder="200"
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        {/* Use my current location helper */}
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              set('officeLatitude',  pos.coords.latitude.toFixed(6));
              set('officeLongitude', pos.coords.longitude.toFixed(6));
            });
          }}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Navigation className="h-3.5 w-3.5" />
          Use my current location as the office
        </button>
        {form.officeLatitude && form.officeLongitude && (
          <a
            href={`https://maps.google.com/?q=${form.officeLatitude},${form.officeLongitude}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1.5 text-xs text-foreground/40 hover:text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" />
            Preview on Google Maps
          </a>
        )}
      </div>

      {/* ── Branding / Theme Colors ── */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Branding &amp; Theme</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary color */}
          <div>
            <label className="text-xs text-foreground/60 mb-2 block">Primary Colour</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { set('primaryColor', c); applyPreview(c, gradEndColor); }}
                  title={c}
                  className="h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: primaryColor === c ? '#fff' : 'transparent',
                    boxShadow: primaryColor === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                >
                  {primaryColor === c && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => { set('primaryColor', e.target.value); applyPreview(e.target.value, gradEndColor); }}
                className="h-9 w-9 rounded-lg border cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { set('primaryColor', e.target.value); if (e.target.value.length === 7) applyPreview(e.target.value, gradEndColor); } }}
                className="h-9 w-28 border border-gray-200 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex-1 h-9 rounded-lg border" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>

          {/* Gradient end color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-foreground/60">Gradient End Colour</label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={gradEnabled}
                  onChange={(e) => set('gradientEnabled', e.target.checked)}
                  className="rounded"
                />
                Enable gradient
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { set('gradientEndColor', c); applyPreview(primaryColor, c); }}
                  title={c}
                  className="h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: gradEndColor === c ? '#fff' : 'transparent',
                    boxShadow: gradEndColor === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                >
                  {gradEndColor === c && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={gradEndColor}
                onChange={(e) => { set('gradientEndColor', e.target.value); applyPreview(primaryColor, e.target.value); }}
                className="h-9 w-9 rounded-lg border cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={gradEndColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { set('gradientEndColor', e.target.value); if (e.target.value.length === 7) applyPreview(primaryColor, e.target.value); } }}
                className="h-9 w-28 border border-gray-200 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div
                className="flex-1 h-9 rounded-lg border"
                style={{
                  background: gradEnabled
                    ? `linear-gradient(135deg, ${primaryColor} 0%, ${gradEndColor} 100%)`
                    : gradEndColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Live preview swatch */}
        <div className="mt-4 rounded-xl overflow-hidden border">
          <div
            className="h-14 flex items-center px-5"
            style={{
              background: gradEnabled
                ? `linear-gradient(135deg, ${primaryColor} 0%, ${gradEndColor} 100%)`
                : primaryColor,
            }}
          >
            <span className="text-white font-bold text-sm">{form.companyName || 'Your Company'}</span>
            <span className="ml-auto text-white/60 text-xs">Theme preview</span>
          </div>
          <div className="bg-white p-3 flex items-center gap-3">
            <div className="h-8 px-4 rounded-lg flex items-center text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>Button</div>
            <span className="text-xs font-semibold" style={{ color: primaryColor }}>Link / text colour</span>
            <div className="h-2 flex-1 rounded-full" style={{ background: gradEnabled ? `linear-gradient(90deg, ${primaryColor}, ${gradEndColor})` : primaryColor }} />
          </div>
        </div>
      </div>

      {/* File uploads */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Logo with preview */}
        <div className="flex flex-col gap-2 p-3 border border-dashed border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/70">
            <Building2 className="h-4 w-4" /> Company Logo
          </div>
          {logoPreviewUrl ? (
            <img
              src={logoPreviewUrl}
              alt="Company logo"
              className="h-16 object-contain rounded border bg-gray-50 p-1"
              onError={() => setLogoPreviewUrl(null)}
            />
          ) : (
            <div className="h-16 rounded border bg-gray-50 flex items-center justify-center">
              <span className="text-xs text-foreground/30">No logo uploaded</span>
            </div>
          )}
          <button
            onClick={() => logoRef.current?.click()}
            disabled={uploading === 'logo'}
            className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading === 'logo' ? 'Uploading…' : logoPreviewUrl ? 'Replace' : 'Upload'}
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile('logo', f); }} />
        </div>

        <UploadField
          label="Company Letterhead"
          icon={<FileText className="h-4 w-4" />}
          accept=".pdf,image/*"
          currentPath={form.letterheadPath}
          uploading={uploading === 'letterhead'}
          inputRef={letterheadRef}
          onPick={() => letterheadRef.current?.click()}
          onChange={(f) => uploadFile('letterhead', f)}
        />
        <UploadField
          label="Terms & Conditions PDF"
          icon={<FileText className="h-4 w-4" />}
          accept=".pdf"
          currentPath={form.termsPath}
          uploading={uploading === 'terms'}
          inputRef={termsRef}
          onPick={() => termsRef.current?.click()}
          onChange={(f) => uploadFile('terms', f)}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-foreground/60">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
    </div>
  );
}

function TextArea({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-foreground/60">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} placeholder={placeholder}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
    </div>
  );
}

function UploadField({ label, icon, accept, currentPath, uploading, inputRef, onPick, onChange }: {
  label: string; icon: React.ReactNode; accept: string;
  currentPath?: string; uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: () => void; onChange: (f: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3 border border-dashed border-gray-200 rounded-xl">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground/70">{icon} {label}</div>
      {currentPath && <p className="text-xs text-green-600 truncate">✓ File uploaded</p>}
      <button onClick={onPick} disabled={uploading}
        className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : currentPath ? 'Replace' : 'Upload'}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
}
