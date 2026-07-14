'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Smartphone, Tv2, Plus, Search, RefreshCw,
  Laptop, Keyboard, Headphones, Mouse, Package,
  AlertCircle, Wrench, X, Check, UserCheck, UserMinus,
  Globe, Cpu, HardDrive,
} from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Device {
  _id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string;
  assetTag: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  currency: string;
  vendor: string | null;
  warrantyExpiry: string | null;
  condition: string;
  status: string;
  assignedTo: string | null;
  assignedEmployee?: { fullName: string; designation: string } | null;
  notes: string | null;
}

interface DeviceSummary {
  total: number;
  assigned: number;
  unassigned: number;
  inRepair: number;
  needsAttention: number;
}

interface SoftwareApp {
  _id: string;
  name: string;
  category: string;
  vendor: string | null;
  licenseType: string;
  totalLicenses: number;
  assignedLicenses: number;
  costPerLicense: number;
  currency: string;
  billingCycle: string;
  renewalDate: string | null;
  loginUrl: string | null;
  status: string;
}

interface SoftwareSummary {
  totalLicenses: number;
  assignedLicenses: number;
  monthlyCost: number;
  expiringSoon: number;
}

interface ITRequest {
  _id: string;
  type: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  requesterName: string;
  assigneeName: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  device?: { name: string; type: string; condition: string; status: string } | null;
  repairNotes?: string | null;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop, desktop: Monitor, phone: Smartphone,
  monitor: Tv2, keyboard: Keyboard, headset: Headphones,
  mouse: Mouse, other: Package,
};

const CONDITION_STYLES: Record<string, { bg: string; text: string }> = {
  new:          { bg: '#d1fae520', text: '#34d399' },
  good:         { bg: '#dbeafe20', text: '#60a5fa' },
  fair:         { bg: '#fef3c720', text: '#fbbf24' },
  needs_repair: { bg: '#fee2e220', text: '#f87171' },
  retired:      { bg: '#f1f5f920', text: '#94a3b8' },
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  assigned:   { color: '#22c55e', label: 'Assigned' },
  unassigned: { color: '#6366f1', label: 'Unassigned' },
  in_repair:  { color: '#f59e0b', label: 'In Repair' },
  retired:    { color: '#64748b', label: 'Retired' },
};

const PRIORITY_STYLES: Record<string, { color: string; bg: string }> = {
  high:   { color: '#f87171', bg: '#fee2e220' },
  medium: { color: '#fbbf24', bg: '#fef3c720' },
  low:    { color: '#94a3b8', bg: '#f1f5f920' },
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  open: '#6366f1', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#64748b',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function warrantyStatus(expiry: string | null): { color: string; label: string } {
  if (!expiry) return { color: '#64748b', label: 'N/A' };
  const diff = new Date(expiry).getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0)   return { color: '#f87171', label: 'Expired' };
  if (days < 180) return { color: '#fbbf24', label: `${days}d left` };
  return { color: '#34d399', label: `${Math.floor(days / 30)}mo left` };
}


// ── Shared components ─────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-4 border border-brand-border/60 bg-brand-bg-soft ${className}`}>{children}</div>;
}

function StatCard({ label, value, color = '#6366f1', icon: Icon }: {
  label: string; value: string | number; color?: string; icon: React.ElementType;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[11px] text-brand-text-secondary uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[24px] font-black text-brand-text">{value}</div>
    </Card>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

// ── Add Device Modal ──────────────────────────────────────────────────────────

function AddDeviceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', type: 'laptop', brand: '', model: '', serialNumber: '',
    assetTag: '', purchaseDate: '', purchasePrice: '', currency: 'KES',
    vendor: '', warrantyExpiry: '', condition: 'good', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.serialNumber) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/devices`,
      method: 'POST',
      data: { ...form, purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined },
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">Add Device</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { label: 'Device Name*', key: 'name', placeholder: 'e.g. MacBook Pro 16' },
            { label: 'Brand', key: 'brand', placeholder: 'Apple' },
            { label: 'Model', key: 'model', placeholder: 'A2141' },
            { label: 'Serial Number*', key: 'serialNumber', placeholder: 'SN123456' },
            { label: 'Asset Tag', key: 'assetTag', placeholder: 'IT-001' },
            { label: 'Vendor / Supplier', key: 'vendor', placeholder: '' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-[11px] text-brand-text-secondary block mb-1">{label}</label>
              <input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Type*</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary">
                {['laptop', 'desktop', 'phone', 'monitor', 'keyboard', 'mouse', 'headset', 'other'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Condition*</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary">
                {['new', 'good', 'fair', 'needs_repair'].map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Warranty Expiry</label>
              <input type="date" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-brand-text-secondary block mb-1">Purchase Price</label>
              <input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Currency</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none focus:ring-1 focus:ring-brand-primary">
                {['KES', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.serialNumber}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Adding…' : 'Add Device'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Software Modal ────────────────────────────────────────────────────────

function AddSoftwareModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', category: 'Productivity', vendor: '', licenseType: 'per_seat',
    totalLicenses: '', costPerLicense: '', currency: 'KES',
    billingCycle: 'monthly', renewalDate: '', loginUrl: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/software`,
      method: 'POST',
      data: { ...form, totalLicenses: Number(form.totalLicenses) || 0, costPerLicense: Number(form.costPerLicense) || 0 },
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">Add Software / App</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { label: 'App Name*', key: 'name', placeholder: 'e.g. Slack' },
            { label: 'Vendor / Provider', key: 'vendor', placeholder: 'Slack Inc.' },
            { label: 'Login URL', key: 'loginUrl', placeholder: 'https://app.slack.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-[11px] text-brand-text-secondary block mb-1">{label}</label>
              <input value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none">
                {['Productivity', 'Dev Tools', 'Communication', 'Design', 'Finance', 'HR', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">License Type</label>
              <select value={form.licenseType} onChange={e => set('licenseType', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none">
                {['per_seat', 'flat_fee', 'usage_based'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Total Licenses</label>
              <input type="number" value={form.totalLicenses} onChange={e => set('totalLicenses', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Cost / License</label>
              <input type="number" value={form.costPerLicense} onChange={e => set('costPerLicense', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Billing Cycle</label>
              <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Renewal Date</label>
              <input type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={save} disabled={saving || !form.name}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Software'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add IT Request Modal ──────────────────────────────────────────────────────

function AddRequestModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'new_equipment', subject: '', description: '', priority: 'medium' });
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isRepair = form.type === 'repair';

  useEffect(() => {
    if (isRepair) {
      apiCallFunction<any>({
        url: `${API_BASE_URL}/it/devices?limit=200`,
        showToast: false,
        returnResponse: true,
        thenFn: r => setDevices(r?.data?.data || []),
      });
    }
  }, [isRepair]);

  const filteredDevices = deviceSearch.trim()
    ? devices.filter(d => d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.serialNumber?.toLowerCase().includes(deviceSearch.toLowerCase()))
    : devices;

  const save = async () => {
    if (!form.subject || !form.description) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/requests`,
      method: 'POST',
      data: {
        ...form,
        deviceId:   selectedDevice?._id   || undefined,
        deviceName: selectedDevice?.name  || undefined,
      },
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">New IT Request</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Request Type</label>
            <select value={form.type} onChange={e => { set('type', e.target.value); setSelectedDevice(null); }}
              className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong focus:outline-none">
              {[
                ['new_equipment',  'New Equipment'],
                ['software_access','Software Access'],
                ['repair',         'Equipment Repair / Replacement'],
                ['password_reset', 'Password Reset / Access Issue'],
                ['other',          'Other IT Support'],
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Repair: device picker */}
          {isRepair && (
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Which device needs repair?</label>
              {selectedDevice ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Wrench className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-amber-300 truncate">{selectedDevice.name}</p>
                    <p className="text-[11px] text-brand-text-muted">{selectedDevice.serialNumber}</p>
                  </div>
                  <button onClick={() => setSelectedDevice(null)} className="text-brand-text-muted hover:text-brand-text-secondary shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                    <input value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} placeholder="Search devices by name or serial…"
                      className="w-full h-9 pl-8 pr-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-brand-border divide-y divide-brand-border/50">
                    {filteredDevices.length === 0
                      ? <p className="text-center py-4 text-brand-text-muted text-[12px]">No devices found</p>
                      : filteredDevices.map(d => {
                          const Icon = DEVICE_ICONS[d.type] || Package;
                          return (
                            <button key={d._id} onClick={() => setSelectedDevice(d)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-muted/50 transition-colors">
                              <Icon className="h-4 w-4 text-brand-text-secondary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-brand-text truncate">{d.name}</p>
                                <p className="text-[11px] text-brand-text-muted">{d.serialNumber}</p>
                              </div>
                              {d.assignedEmployee && (
                                <span className="text-[10px] text-brand-text-muted truncate max-w-[80px]">{d.assignedEmployee.fullName}</span>
                              )}
                            </button>
                          );
                        })}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Subject*</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder={isRepair ? 'e.g. Laptop screen is cracked' : 'Brief description'}
              className="w-full h-9 px-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Description*</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder={isRepair ? 'Describe the fault in detail — when it started, what happened…' : 'Provide details about your request…'}
              className="w-full px-3 py-2 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => set('priority', p)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold capitalize transition-colors ${form.priority === p ? 'ring-2 ring-brand-primary' : ''}`}
                  style={{ background: PRIORITY_STYLES[p]?.bg, color: PRIORITY_STYLES[p]?.color }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={save} disabled={saving || !form.subject || !form.description}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Device Modal ───────────────────────────────────────────────────────

interface Employee { _id: string; fullName: string; designation?: string; department?: string; }

function AssignDeviceModal({ device, onClose, onSaved }: {
  device: Device; onClose: () => void; onSaved: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=200`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setEmployees(r?.data?.data || []),
    });
  }, []);

  const filtered = search.trim()
    ? employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const save = async () => {
    if (!selected) return;
    if (!confirm(`Assign "${device.name}" to ${selected.fullName}?\nThis will make them responsible for this device.`)) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/devices/${device._id}/assign`,
      method: 'POST',
      data: { employeeId: selected._id },
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <div>
            <h2 className="text-[15px] font-bold text-brand-text">Assign Device</h2>
            <p className="text-[12px] text-brand-text-secondary mt-0.5">{device.name}</p>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-brand-border divide-y divide-brand-border/50">
            {filtered.length === 0 ? (
              <p className="text-center py-6 text-brand-text-muted text-[13px]">No employees found</p>
            ) : filtered.map(e => (
              <button key={e._id} onClick={() => setSelected(e)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selected?._id === e._id ? 'bg-brand-primary/20' : 'hover:bg-brand-bg-muted/40'
                }`}>
                <div className="h-8 w-8 rounded-full bg-brand-primary/30 flex items-center justify-center text-[12px] font-bold text-indigo-300 shrink-0">
                  {e.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-brand-text truncate">{e.fullName}</div>
                  {e.designation && <div className="text-[11px] text-brand-text-muted truncate">{e.designation}</div>}
                </div>
                {selected?._id === e._id && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={save} disabled={saving || !selected}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Assigning…' : `Assign to ${selected?.fullName.split(' ')[0] ?? '…'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Devices Tab ───────────────────────────────────────────────────────────────

function DevicesTab({ isHR }: { isHR: boolean }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [summary, setSummary] = useState<DeviceSummary | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    Promise.all([
      apiCallFunction<{ data: { data: Device[] } }>({
        url: `${API_BASE_URL}/it/devices`,
        params,
        showToast: false,
        returnResponse: true,
        thenFn: r => setDevices(r?.data?.data || []),
      }),
      isHR && apiCallFunction<{ data: DeviceSummary }>({
        url: `${API_BASE_URL}/it/devices/summary`,
        showToast: false,
        returnResponse: true,
        thenFn: r => { if (r?.data) setSummary(r.data); },
      }),
    ]).finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter, isHR]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const unassign = (id: string, deviceName: string) => {
    if (!confirm(`Unassign "${deviceName}" from its current user?\nThis action cannot be undone without re-assigning.`)) return;
    apiCallFunction({
      url: `${API_BASE_URL}/it/devices/${id}/unassign`,
      method: 'POST',
      thenFn: fetchAll,
    });
  };

  return (
    <div>
      {showAdd && <AddDeviceModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
      {assignTarget && <AssignDeviceModal device={assignTarget} onClose={() => setAssignTarget(null)} onSaved={fetchAll} />}

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-5">
          <StatCard label="Total" value={summary.total} icon={HardDrive} color="#6366f1" />
          <StatCard label="Assigned" value={summary.assigned} icon={UserCheck} color="#22c55e" />
          <StatCard label="Unassigned" value={summary.unassigned} icon={Package} color="#3b82f6" />
          <StatCard label="In Repair" value={summary.inRepair} icon={Wrench} color="#f59e0b" />
          <StatCard label="Needs Attention" value={summary.needsAttention} icon={AlertCircle} color={summary.needsAttention > 0 ? '#f87171' : '#64748b'} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-brand-bg-soft text-brand-text text-[13px] border border-brand-border placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-brand-bg-soft text-brand-text-secondary text-[13px] border border-brand-border focus:outline-none">
          <option value="all">All Types</option>
          {['laptop', 'desktop', 'phone', 'monitor', 'keyboard', 'mouse', 'headset', 'other'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-brand-bg-soft text-brand-text-secondary text-[13px] border border-brand-border focus:outline-none">
          <option value="all">All Status</option>
          {['assigned', 'unassigned', 'in_repair', 'retired'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <button onClick={fetchAll} className="h-9 w-9 rounded-lg flex items-center justify-center text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {isHR && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors ml-auto">
            <Plus className="h-3.5 w-3.5" /> Add Device
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-brand-border">
              {['Device', 'Type', 'Serial No.', 'Assigned To', 'Condition', 'Warranty', 'Status', ...(isHR ? ['Actions'] : [])].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr><td colSpan={isHR ? 8 : 7} className="text-center py-10 text-brand-text-muted">No devices found</td></tr>
            ) : devices.map(d => {
              const Icon = DEVICE_ICONS[d.type] || Package;
              const cond = CONDITION_STYLES[d.condition] || CONDITION_STYLES.good;
              const stat = STATUS_STYLES[d.status] || STATUS_STYLES.unassigned;
              const warr = warrantyStatus(d.warrantyExpiry);
              return (
                <tr key={d._id} className="border-b border-brand-border/50 hover:bg-brand-bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-primary/20">
                        <Icon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-brand-text">{d.name}</div>
                        {d.brand && <div className="text-[11px] text-brand-text-muted">{d.brand} {d.model || ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary capitalize">{d.type}</td>
                  <td className="px-4 py-3 text-brand-text-secondary font-mono text-[12px]">{d.serialNumber}</td>
                  <td className="px-4 py-3">
                    {d.assignedEmployee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-brand-primary/40 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                          {d.assignedEmployee.fullName[0]}
                        </div>
                        <span className="text-brand-text-secondary">{d.assignedEmployee.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={d.condition.replace('_', ' ')} color={cond.text} bg={cond.bg} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold" style={{ color: warr.color }}>{warr.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold" style={{ color: stat.color }}>{stat.label}</span>
                  </td>
                  {isHR && (
                    <td className="px-4 py-3">
                      {d.status === 'assigned' ? (
                        <button onClick={() => unassign(d._id, d.name)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">
                          <UserMinus className="h-3.5 w-3.5" /> Unassign
                        </button>
                      ) : d.status !== 'retired' ? (
                        <button onClick={() => setAssignTarget(d)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                          <UserCheck className="h-3.5 w-3.5" /> Assign
                        </button>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Software Tab ──────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Productivity: '#6366f1', 'Dev Tools': '#3b82f6', Communication: '#22c55e',
  Design: '#ec4899', Finance: '#f59e0b', HR: '#a78bfa', Other: '#64748b',
};

// Assign Software Access Modal
function AssignSoftwareModal({ app, onClose, onSaved }: {
  app: SoftwareApp; onClose: () => void; onSaved: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const catColor = CAT_COLORS[app.category] || '#64748b';
  const seatsLeft = app.totalLicenses > 0 ? app.totalLicenses - app.assignedLicenses : Infinity;

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=200`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setEmployees(r?.data?.data || []),
    });
  }, []);

  const filtered = search.trim()
    ? employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const grant = async () => {
    if (!selected) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/software/${app._id}/assign/${selected._id}`,
      method: 'POST',
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-base font-black"
              style={{ background: `${catColor}20`, color: catColor }}>
              {app.name[0]}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-brand-text">Grant Access</h2>
              <p className="text-[11px] text-brand-text-secondary">{app.name} · {seatsLeft === Infinity ? '∞' : seatsLeft} seats left</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          {seatsLeft === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-600/10 text-red-400 text-[13px] mb-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No seats available. Increase the license count first.
            </div>
          ) : null}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-brand-border divide-y divide-brand-border/50">
            {filtered.length === 0 ? (
              <p className="text-center py-6 text-brand-text-muted text-[13px]">No employees found</p>
            ) : filtered.map(e => (
              <button key={e._id} onClick={() => setSelected(e)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selected?._id === e._id ? 'bg-brand-primary/20' : 'hover:bg-brand-bg-muted/40'
                }`}>
                <div className="h-8 w-8 rounded-full bg-brand-primary/30 flex items-center justify-center text-[12px] font-bold text-indigo-300 shrink-0">
                  {e.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-brand-text truncate">{e.fullName}</div>
                  {e.designation && <div className="text-[11px] text-brand-text-muted truncate">{e.designation}</div>}
                </div>
                {selected?._id === e._id && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={grant} disabled={saving || !selected || seatsLeft === 0}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Granting…' : `Grant Access`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SoftwareTab({ isHR }: { isHR: boolean }) {
  const [apps, setApps] = useState<SoftwareApp[]>([]);
  const [summary, setSummary] = useState<SoftwareSummary | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [assignTarget, setAssignTarget] = useState<SoftwareApp | null>(null);

  const fetchAll = useCallback(() => {
    apiCallFunction<{ data: SoftwareApp[] }>({
      url: `${API_BASE_URL}/it/software`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setApps(r?.data || []),
    });
    if (isHR) {
      apiCallFunction<{ data: SoftwareSummary }>({
        url: `${API_BASE_URL}/it/software/summary`,
        showToast: false,
        returnResponse: true,
        thenFn: r => { if (r?.data) setSummary(r.data); },
      });
    }
  }, [isHR]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div>
      {showAdd && <AddSoftwareModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
      {assignTarget && <AssignSoftwareModal app={assignTarget} onClose={() => setAssignTarget(null)} onSaved={fetchAll} />}

      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Licenses" value={summary.totalLicenses} icon={Cpu} color="#6366f1" />
          <StatCard label="In Use" value={summary.assignedLicenses} icon={UserCheck} color="#22c55e" />
          <StatCard label="Monthly Cost" value={`KES ${summary.monthlyCost.toLocaleString()}`} icon={Globe} color="#f59e0b" />
          <StatCard label="Expiring Soon" value={summary.expiringSoon} icon={AlertCircle} color={summary.expiringSoon > 0 ? '#f87171' : '#64748b'} />
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] text-brand-text-secondary">{apps.length} applications</span>
        {isHR && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Software
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {apps.map(app => {
          const used = app.totalLicenses > 0 ? Math.round((app.assignedLicenses / app.totalLicenses) * 100) : 0;
          const catColor = CAT_COLORS[app.category] || '#64748b';
          const isExpiring = app.renewalDate && (new Date(app.renewalDate).getTime() - Date.now()) < 30 * 86400000;
          const seatsLeft = app.totalLicenses > 0 ? app.totalLicenses - app.assignedLicenses : null;
          return (
            <Card key={app._id}>
              <div className="flex items-start justify-between mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${catColor}20`, color: catColor }}>
                  {app.name[0]}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${catColor}20`, color: catColor }}>
                  {app.category}
                </span>
              </div>
              <div className="font-bold text-brand-text text-[14px] mb-0.5">{app.name}</div>
              {app.vendor && <div className="text-[11px] text-brand-text-muted mb-2">{app.vendor}</div>}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-brand-bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${used}%`, background: used > 90 ? '#f87171' : catColor }} />
                </div>
                <span className="text-[11px] text-brand-text-secondary whitespace-nowrap">{app.assignedLicenses}/{app.totalLicenses || '∞'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-3">
                <span className="text-brand-text-muted">
                  {app.costPerLicense > 0 ? `${app.currency} ${app.costPerLicense.toLocaleString()}/${app.billingCycle === 'annual' ? 'yr' : 'mo'}` : 'Free'}
                </span>
                <span className="font-semibold" style={{ color: isExpiring ? '#fbbf24' : app.status === 'active' ? '#22c55e' : '#64748b' }}>
                  {isExpiring ? 'Expiring' : app.status}
                </span>
              </div>
              {/* Grant access button */}
              {isHR && (
                <button onClick={() => setAssignTarget(app)}
                  disabled={seatsLeft === 0}
                  className="w-full h-8 rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `${catColor}20`, color: catColor }}>
                  <UserCheck className="h-3.5 w-3.5" />
                  {seatsLeft === 0 ? 'No seats left' : `Grant Access${seatsLeft !== null ? ` · ${seatsLeft} left` : ''}`}
                </button>
              )}
            </Card>
          );
        })}
        {apps.length === 0 && (
          <div className="col-span-3 text-center py-12 text-brand-text-muted">No software apps added yet</div>
        )}
      </div>
    </div>
  );
}

// ── Assign Request Modal ──────────────────────────────────────────────────────

function AssignRequestModal({ request, onClose, onSaved }: {
  request: ITRequest; onClose: () => void; onSaved: () => void;
}) {
  const isRepair = request.type === 'repair';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCallFunction<{ data: { data: Employee[] } }>({
      url: `${API_BASE_URL}/employees?limit=200`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setEmployees(r?.data?.data || []),
    });
  }, []);

  const filtered = search.trim()
    ? employees.filter(e => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const assign = async () => {
    if (!selected) return;
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/requests/${request._id}`,
      method: 'PUT',
      data: { assignedTo: selected._id, status: 'in_progress', repairNotes: repairNotes || undefined },
      thenFn: () => { onSaved(); onClose(); },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <div>
            <h2 className="text-[15px] font-bold text-brand-text">{isRepair ? 'Assign Technician' : 'Assign Request'}</h2>
            <p className="text-[12px] text-brand-text-secondary mt-0.5 truncate max-w-xs">{request.subject}</p>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text shrink-0"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {/* Repair: show device being repaired */}
          {isRepair && request.device && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[12px]">
              <Wrench className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-amber-300 font-semibold">{request.device.name}</span>
                <span className="text-brand-text-muted ml-2">will be marked <span className="text-amber-400 font-semibold">In Repair</span> once assigned</span>
              </div>
            </div>
          )}
          {isRepair && !request.device && request.deviceName && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-brand-bg-muted/50 border border-brand-border-strong text-[12px]">
              <Wrench className="h-4 w-4 text-brand-text-secondary shrink-0" />
              <span className="text-brand-text-secondary">{request.deviceName}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1.5">
              {isRepair ? 'Who will handle this repair?' : 'Assign to'}
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={isRepair ? 'Search technician / handler…' : 'Search employees…'}
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-brand-border divide-y divide-brand-border/50">
              {filtered.length === 0 ? (
                <p className="text-center py-6 text-brand-text-muted text-[13px]">No employees found</p>
              ) : filtered.map(e => (
                <button key={e._id} onClick={() => setSelected(e)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selected?._id === e._id ? 'bg-brand-primary/20' : 'hover:bg-brand-bg-muted/40'
                  }`}>
                  <div className="h-7 w-7 rounded-full bg-brand-primary/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
                    {e.fullName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-brand-text truncate">{e.fullName}</div>
                    {e.designation && <div className="text-[11px] text-brand-text-muted truncate">{e.designation}</div>}
                  </div>
                  {selected?._id === e._id && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {isRepair && (
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Repair Instructions / Notes (optional)</label>
              <textarea value={repairNotes} onChange={e => setRepairNotes(e.target.value)} rows={2}
                placeholder="Describe what needs to be done, parts to check, etc."
                className="w-full px-3 py-2 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
          )}

          <p className="text-[11px] text-brand-text-muted">
            {isRepair
              ? 'The technician will receive a notification. Device status will be set to In Repair.'
              : 'The assignee will receive an inbox notification. Status will be set to In Progress.'}
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={assign} disabled={saving || !selected}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Assigning…' : isRepair ? `Assign Technician` : `Assign to ${selected?.fullName.split(' ')[0] ?? '…'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resolve Repair Modal ──────────────────────────────────────────────────────

function ResolveRepairModal({ request, onClose, onSaved }: {
  request: ITRequest; onClose: () => void; onSaved: () => void;
}) {
  const isRepair = request.type === 'repair';
  const [resolution, setResolution] = useState('');
  const [updatedCondition, setUpdatedCondition] = useState('good');
  const [saving, setSaving] = useState(false);

  const resolve = async () => {
    setSaving(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/it/requests/${request._id}/resolve`,
      method: 'PUT',
      data: { resolution, updatedCondition },
      thenFn: () => { onSaved(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.85)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#1e293b' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">Mark as Resolved</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {isRepair && request.device && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[12px]">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-brand-text-secondary"><span className="text-emerald-300 font-semibold">{request.device.name}</span> will be returned to <span className="text-emerald-400 font-semibold">Available</span></span>
            </div>
          )}
          {isRepair && (
            <div>
              <label className="text-[11px] text-brand-text-secondary block mb-1">Device condition after repair</label>
              <div className="flex gap-2">
                {(['new', 'good', 'fair', 'needs_repair'] as const).map(c => (
                  <button key={c} onClick={() => setUpdatedCondition(c)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all border ${
                      updatedCondition === c ? 'border-brand-primary bg-brand-primary/20 text-indigo-300' : 'border-brand-border-strong bg-brand-bg-muted/50 text-brand-text-secondary'
                    }`}>
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] text-brand-text-secondary block mb-1">Resolution notes</label>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
              placeholder={isRepair ? 'What was fixed? What parts were replaced?' : 'How was this resolved?'}
              className="w-full px-3 py-2 rounded-lg bg-brand-bg-muted text-brand-text text-[13px] border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] text-brand-text-secondary hover:bg-brand-bg-muted">Cancel</button>
          <button onClick={resolve} disabled={saving}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Mark Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IT Requests Tab ───────────────────────────────────────────────────────────

function RequestsTab() {
  const { isHR } = useAuth();
  const [requests, setRequests]       = useState<ITRequest[]>([]);
  const [showAdd, setShowAdd]         = useState(false);
  const [assignTarget, setAssignTarget] = useState<ITRequest | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ITRequest | null>(null);

  const fetchAll = useCallback(() => {
    apiCallFunction<{ data: { data: ITRequest[] } }>({
      url: `${API_BASE_URL}/it/requests`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setRequests(r?.data?.data || []),
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div>
      {showAdd        && <AddRequestModal    onClose={() => setShowAdd(false)}        onSaved={fetchAll} />}
      {assignTarget   && <AssignRequestModal  request={assignTarget}  onClose={() => setAssignTarget(null)}  onSaved={fetchAll} />}
      {resolveTarget  && <ResolveRepairModal  request={resolveTarget} onClose={() => setResolveTarget(null)} onSaved={fetchAll} />}

      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] text-brand-text-secondary">{requests.length} requests</span>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Request
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-brand-border">
              {['Subject', 'Type', 'Device', 'Requester', 'Technician / Handler', 'Priority', 'Status', 'Date', ...(isHR ? ['Actions'] : [])].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={isHR ? 9 : 8} className="text-center py-10 text-brand-text-muted">No IT requests yet</td></tr>
            ) : requests.map(r => {
              const prio = PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.low;
              const isActive = r.status === 'open' || r.status === 'in_progress';
              const isRepair = r.type === 'repair';
              return (
                <tr key={r._id} className="border-b border-brand-border/50 hover:bg-brand-bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-brand-text">{r.subject}</div>
                    {r.repairNotes && <div className="text-[11px] text-brand-text-muted mt-0.5 truncate max-w-[160px]">{r.repairNotes}</div>}
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary capitalize whitespace-nowrap">{r.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    {isRepair && r.device ? (
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-[12px] text-brand-text-secondary font-semibold">{r.device.name}</div>
                          <div className="text-[10px] text-brand-text-muted capitalize">{r.device.status.replace('_', ' ')}</div>
                        </div>
                      </div>
                    ) : isRepair && r.deviceName ? (
                      <span className="text-[12px] text-brand-text-secondary">{r.deviceName}</span>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">{r.requesterName}</td>
                  <td className="px-4 py-3">
                    {r.assigneeName ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-amber-600/30 flex items-center justify-center text-[9px] font-bold text-amber-300 shrink-0">
                          {r.assigneeName[0]}
                        </div>
                        <span className="text-brand-text-secondary">{r.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-brand-text-muted text-[11px] italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={r.priority} color={prio.color} bg={prio.bg} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[12px] font-semibold capitalize" style={{ color: REQUEST_STATUS_COLORS[r.status] || '#64748b' }}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                  </td>
                  {isHR && (
                    <td className="px-4 py-3">
                      {isActive && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => setAssignTarget(r)}
                            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                            <UserCheck className="h-3.5 w-3.5" /> {isRepair ? 'Assign Technician' : 'Assign'}
                          </button>
                          <button onClick={() => setResolveTarget(r)}
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap">
                            <Check className="h-3.5 w-3.5" /> Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS = ['devices', 'software', 'requests'] as const;
type TabType = typeof TABS[number];
const TAB_LABELS: Record<TabType, string> = { devices: 'Devices', software: 'Software & Apps', requests: 'IT Requests' };

export default function ITManagementPage() {
  const { isHR } = useAuth();
  const [tab, setTab] = useState<TabType>('devices');

  return (
    <div className="min-h-full" style={{ background: '#0f172a' }}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-brand-text">Assets Management</h1>
          <p className="text-[13px] text-brand-text-secondary mt-0.5">Devices, software licenses, and IT support</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border/50 mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-[13px] font-semibold relative transition-colors ${tab === t ? 'text-indigo-400' : 'text-brand-text-muted hover:text-brand-text-secondary'}`}>
            {TAB_LABELS[t]}
            {tab === t && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />}
     </button>
        ))}
      </div>

      {tab === 'devices'   && <DevicesTab isHR={isHR} />}
      {tab === 'software'  && <SoftwareTab isHR={isHR} />}
      {tab === 'requests'  && <RequestsTab />}
    </div>
  );
}
