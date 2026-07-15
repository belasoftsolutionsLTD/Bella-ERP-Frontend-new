'use client';

import { useState } from 'react';
import {
  Building2, Shield, Mail, Lock, Puzzle, Bell, Landmark, MessageSquare,
  Save, Check, X, Eye, EyeOff,
  ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useConfigSection } from '@/hooks/useConfigSection';
import { CompanySettingsPanel } from '../Components/CompanySettingsPanel';
import { CompanyAccountsPanel } from '../Components/CompanyAccountsPanel';
import { CommunicationSettingsPanel } from '../Components/CommunicationSettingsPanel';

// ── Shared ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled}
      className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-bg-soft text-brand-text text-[13px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed" />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-bg-soft text-brand-text text-[13px] focus:outline-none focus:ring-1 focus:ring-brand-primary">
      {children}
    </select>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-[13px] font-semibold transition-colors disabled:opacity-50">
      {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[17px] font-bold text-brand-text">{title}</h2>
      <p className="text-[13px] text-brand-text-secondary mt-0.5">{desc}</p>
    </div>
  );
}

// ── Company Accounts (wrapper to fetch data for the no-props section slot) ────

function CompanyAccountsSection() {
  const companyAccounts = useConfigSection('company-accounts');
  return <CompanyAccountsPanel items={companyAccounts.items as any} refetch={companyAccounts.refetch} />;
}

// ── Permissions & Roles ───────────────────────────────────────────────────────

const PERMISSIONS = [
  { label: 'View Payroll', key: 'viewPayroll', allowedRoles: ['super_admin', 'hr_manager'] },
  { label: 'Approve Leave', key: 'approveLeave', allowedRoles: ['super_admin', 'hr_manager', 'department_head'] },
  { label: 'Submit Expenses', key: 'submitExpenses', allowedRoles: ['super_admin', 'hr_manager', 'department_head', 'staff'] },
  { label: 'Manage Employees', key: 'manageEmployees', allowedRoles: ['super_admin', 'hr_manager'] },
  { label: 'View Reports', key: 'viewReports', allowedRoles: ['super_admin', 'hr_manager', 'department_head'] },
  { label: 'Manage IT Assets', key: 'manageITAssets', allowedRoles: ['super_admin', 'hr_manager'] },
  { label: 'Run Payroll', key: 'runPayroll', allowedRoles: ['super_admin', 'hr_manager'] },
  { label: 'Configure Settings', key: 'configureSettings', allowedRoles: ['super_admin'] },
];

const ROLES = ['super_admin', 'hr_manager', 'department_head', 'staff'];
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', hr_manager: 'HR Manager', department_head: 'Dept Head', staff: 'Staff',
};

function PermissionsSection() {
  return (
    <div>
      <SectionHeader title="Permissions & Roles" desc="Role-based access control for system features" />
      <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left px-4 py-3 text-[11px] text-brand-text-secondary uppercase tracking-wider font-semibold">Permission</th>
              {ROLES.map(r => (
                <th key={r} className="text-center px-4 py-3 text-[11px] text-brand-text-secondary uppercase tracking-wider font-semibold">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(p => (
              <tr key={p.key} className="border-b border-brand-border/50 hover:bg-brand-bg-muted/20">
                <td className="px-4 py-3 font-medium text-brand-text">{p.label}</td>
                {ROLES.map(r => (
                  <td key={r} className="px-4 py-3 text-center">
                    {p.allowedRoles.includes(r) ? (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-600/20">
                        <Check className="h-3 w-3 text-green-400" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-bg-muted">
                        <X className="h-3 w-3 text-brand-text-muted" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-brand-text-muted mt-3">
        Role permissions are enforced at the API level. Contact your system administrator to modify role assignments.
      </p>
    </div>
  );
}

// ── Email Templates ───────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  { id: 'welcome', label: 'Welcome Email', desc: 'Sent to new employees on account creation' },
  { id: 'leave_approved', label: 'Leave Approved', desc: 'Sent when an employee\'s leave is approved' },
  { id: 'leave_declined', label: 'Leave Declined', desc: 'Sent when an employee\'s leave is rejected' },
  { id: 'payslip', label: 'Payslip Ready', desc: 'Sent when payslip is generated for the month' },
  { id: 'onboarding', label: 'Onboarding Checklist', desc: 'Sent to new hires with onboarding tasks' },
  { id: 'performance_review', label: 'Performance Review', desc: 'Sent when a review cycle is opened' },
];

function EmailTemplatesSection() {
  const [active, setActive] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const open = (id: string) => {
    setActive(id);
    setSubject(`[{{company_name}}] ${EMAIL_TEMPLATES.find(t => t.id === id)?.label}`);
    setBody('Dear {{employee_name}},\n\nThis is an automated message from {{company_name}}.\n\n{{content}}\n\nRegards,\nHR Team');
  };

  return (
    <div>
      <SectionHeader title="Email Templates" desc="Customise the automated emails sent to employees" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        {EMAIL_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => open(t.id)}
            className={`text-left p-4 rounded-xl border transition-colors ${active === t.id ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border/60 bg-brand-bg-soft hover:border-brand-border-strong'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-text text-[13px]">{t.label}</span>
              <ChevronRight className={`h-4 w-4 text-brand-text-muted transition-transform ${active === t.id ? 'rotate-90' : ''}`} />
            </div>
            <p className="text-[11px] text-brand-text-muted mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-2xl border border-brand-border/60 overflow-hidden bg-brand-bg-soft">
          <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
            <span className="text-[13px] font-bold text-brand-text">
              Editing: {EMAIL_TEMPLATES.find(t => t.id === active)?.label}
            </span>
            <button onClick={() => setActive(null)} className="text-brand-text-muted hover:text-brand-text-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <Field label="Subject">
              <Input value={subject} onChange={setSubject} placeholder="Email subject…" />
            </Field>
            <Field label="Body">
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={8}
                className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-brand-bg-soft text-brand-text text-[13px] font-mono resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </Field>
            <p className="text-[11px] text-brand-text-muted">
              Variables: <code className="text-indigo-400">{'{{employee_name}}'}</code>, <code className="text-indigo-400">{'{{company_name}}'}</code>, <code className="text-indigo-400">{'{{content}}'}</code>
            </p>
            <div className="flex justify-end">
              <SaveButton onClick={() => {}} saving={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────

function SecuritySection() {
  const [showKey, setShowKey] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('480');
  const [minLength, setMinLength] = useState('8');

  return (
    <div>
      <SectionHeader title="Security" desc="Authentication and session security settings" />
      <div className="space-y-4">
        {/* Password policy */}
        <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-bg-soft">
          <h3 className="text-[14px] font-bold text-brand-text mb-3">Password Policy</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum Length">
              <Input value={minLength} onChange={setMinLength} type="number" placeholder="8" />
            </Field>
            <Field label="Session Timeout (minutes)">
              <Input value={sessionTimeout} onChange={setSessionTimeout} type="number" placeholder="480" />
            </Field>
          </div>
          <div className="mt-3 space-y-2">
            {[
              'Require uppercase letter',
              'Require number',
              'Require special character',
              'Prevent password reuse (last 5)',
            ].map(rule => (
              <label key={rule} className="flex items-center gap-2.5 cursor-pointer">
                <div className="h-4 w-4 rounded border border-brand-primary bg-brand-primary/30 flex items-center justify-center">
                  <Check className="h-3 w-3 text-indigo-400" />
                </div>
                <span className="text-[13px] text-brand-text-secondary">{rule}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2FA */}
        <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-bg-soft">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-brand-text">Two-Factor Authentication</h3>
              <p className="text-[12px] text-brand-text-muted mt-0.5">Require 2FA for admin and HR roles</p>
            </div>
            <button onClick={() => setTwoFaEnabled(v => !v)}
              className={`h-6 w-11 rounded-full transition-colors relative ${twoFaEnabled ? 'bg-brand-primary' : 'bg-brand-bg-muted'}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${twoFaEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="p-4 rounded-2xl border border-brand-border/60 bg-brand-bg-soft">
          <h3 className="text-[14px] font-bold text-brand-text mb-2">API Key</h3>
          <p className="text-[12px] text-brand-text-muted mb-3">Used for external integrations and webhooks</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 px-3 rounded-lg border border-brand-border bg-white flex items-center">
              <span className="text-[13px] font-mono text-brand-text-secondary">
                {showKey ? 'sk-live-abc123def456ghi789jkl012mno345pqr678' : '••••••••••••••••••••••••••••••••••••••'}
              </span>
            </div>
            <button onClick={() => setShowKey(v => !v)}
              className="h-10 w-10 rounded-lg border border-brand-border flex items-center justify-center text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Keep this secret. Regenerate if compromised.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Integrations ──────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', desc: 'Send HR notifications to Slack channels', icon: '🔔', connected: false },
  { id: 'google', name: 'Google Workspace', desc: 'Sync calendar and users with Google', icon: '📅', connected: false },
  { id: 'ms365', name: 'Microsoft 365', desc: 'Sync with Outlook and Teams', icon: '📧', connected: false },
  { id: 'mpesa', name: 'M-Pesa', desc: 'Automate payroll disbursement', icon: '💳', connected: false },
  { id: 'zoom', name: 'Zoom', desc: 'Automatically create interview links', icon: '📹', connected: false },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Transactional email delivery', icon: '✉️', connected: false },
];

function IntegrationsSection() {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  return (
    <div>
      <SectionHeader title="Integrations" desc="Connect third-party services to your HR system" />
      <div className="grid grid-cols-2 gap-3">
        {INTEGRATIONS.map(i => {
          const isConnected = connected.has(i.id);
          return (
            <div key={i.id} className="p-4 rounded-2xl border border-brand-border/60 bg-brand-bg-soft flex items-start gap-3">
              <span className="text-2xl">{i.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-brand-text text-[13px]">{i.name}</span>
                  <button onClick={() => setConnected(prev => {
                    const next = new Set(prev);
                    next.has(i.id) ? next.delete(i.id) : next.add(i.id);
                    return next;
                  })}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      isConnected
                        ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400'
                        : 'bg-brand-primary/20 text-indigo-400 hover:bg-brand-primary-hover/40'
                    }`}>
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
                <p className="text-[11px] text-brand-text-muted mt-0.5">{i.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Notification Preferences ──────────────────────────────────────────────────

const NOTIF_PREFS = [
  { id: 'leave_submitted', label: 'Leave Request Submitted', channels: ['email', 'in_app'] },
  { id: 'leave_approved', label: 'Leave Approved / Declined', channels: ['email', 'in_app'] },
  { id: 'expense_submitted', label: 'Expense Claim Submitted', channels: ['in_app'] },
  { id: 'payslip_ready', label: 'Payslip Ready', channels: ['email', 'in_app'] },
  { id: 'birthday', label: 'Birthday Reminders', channels: ['in_app'] },
  { id: 'anniversary', label: 'Work Anniversaries', channels: ['in_app'] },
  { id: 'performance_review', label: 'Performance Review Due', channels: ['email', 'in_app'] },
  { id: 'it_request_resolved', label: 'IT Request Resolved', channels: ['in_app'] },
];

function NotificationPreferencesSection() {
  const [enabled, setEnabled] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    NOTIF_PREFS.forEach(p => { init[p.id] = new Set(p.channels); });
    return init;
  });

  const toggle = (prefId: string, channel: string) => {
    setEnabled(prev => {
      const cur = new Set(prev[prefId]);
      cur.has(channel) ? cur.delete(channel) : cur.add(channel);
      return { ...prev, [prefId]: cur };
    });
  };

  return (
    <div>
      <SectionHeader title="Notification Preferences" desc="Control which notifications are sent and how" />
      <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
        <div className="grid grid-cols-[1fr_100px_100px] gap-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-brand-border text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider">Event</div>
          {['Email', 'In-App'].map(h => (
            <div key={h} className="px-4 py-3 border-b border-brand-border text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wider text-center">{h}</div>
          ))}
          {/* Rows */}
          {NOTIF_PREFS.map(p => (
            <>
              <div key={`${p.id}-label`} className="px-4 py-3 border-b border-brand-border/50 text-[13px] text-brand-text">{p.label}</div>
              {['email', 'in_app'].map(ch => (
                <div key={`${p.id}-${ch}`} className="px-4 py-3 border-b border-brand-border/50 flex items-center justify-center">
                  <button onClick={() => toggle(p.id, ch)}
                    className={`h-5 w-5 rounded border transition-colors flex items-center justify-center ${
                      enabled[p.id]?.has(ch) ? 'bg-brand-primary border-brand-primary' : 'border-brand-border-strong bg-brand-bg-soft'
                    }`}>
                    {enabled[p.id]?.has(ch) && <Check className="h-3 w-3 text-white" />}
                  </button>
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <SaveButton onClick={() => {}} saving={false} />
      </div>
    </div>
  );
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'company',         label: 'Company Settings',         icon: Building2 },
  { id: 'companyAccounts', label: 'Company Accounts',         icon: Landmark },
  { id: 'communication',   label: 'Communication',            icon: MessageSquare },
  { id: 'permissions',     label: 'Permissions & Roles',      icon: Shield },
  { id: 'email',           label: 'Email Templates',          icon: Mail },
  { id: 'security',        label: 'Security',                 icon: Lock },
  { id: 'integrations',    label: 'Integrations',             icon: Puzzle },
  { id: 'notifications',   label: 'Notification Preferences', icon: Bell },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  company:         CompanySettingsPanel,
  companyAccounts: CompanyAccountsSection,
  communication:   CommunicationSettingsPanel,
  permissions:     PermissionsSection,
  email:           EmailTemplatesSection,
  security:        SecuritySection,
  integrations:    IntegrationsSection,
  notifications:   NotificationPreferencesSection,
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>('company');
  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div className="min-h-full" style={{ background: '#ffffff' }}>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-brand-text">Settings</h1>
        <p className="text-[13px] text-brand-text-secondary mt-0.5">Configure your HR system preferences and integrations</p>
      </div>

      <div className="flex gap-5">
        {/* Left nav */}
        <div className="w-[220px] shrink-0">
          <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-left transition-colors relative ${
                  active === s.id ? 'text-indigo-400 bg-brand-primary/10' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-muted/30'
                }`}>
                {active === s.id && <span className="absolute left-0 inset-y-2 w-0.5 bg-brand-primary rounded-r-full" />}
                <s.icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-brand-border/60 p-5 bg-brand-bg-soft">
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
}
