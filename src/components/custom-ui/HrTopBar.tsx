'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, X, Globe, ChevronDown, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

const PAGE_LABELS: Record<string, string> = {
  dashboard:        'Dashboard',
  employees:        'Organization',
  recruitment:      'Recruitment',
  onboarding:       'Onboarding',
  offboarding:      'Offboarding',
  'org-chart':      'Org Chart',
  documents:        'Documents',
  leave:            'Leave Management',
  attendance:       'Shift & Time',
  payroll:          'Payroll',
  performance:      'Performance',
  expenses:         'Expenses',
  communications:   'Communications',
  reports:          'Reports',
  certifications:   'Awards & Recognition',
  config:           'Configuration',
  accounts:         'User Accounts',
  'staff-portal':   'My Portal',
  tasks:            'Tasks',
  events:           'Calendar',
  inbox:            'Inbox',
  'it-management':      'Asset Management',
  'assets-management':  'Asset Management',
  settings:         'Settings',
  training:         'Training',
  notifications:    'Notifications',
};

interface HrNotification {
  _id: string;
  title: string;
  body: string;
  subtitle?: string;
  type: string;
  isRead: boolean;
  navigateTo?: string | null;
  createdAt: string;
}

const LOCALES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'sw', label: 'Kiswahili',  flag: '🇰🇪' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ha', label: 'Hausa',      flag: '🇳🇬' },
  { code: 'so', label: 'Somali',     flag: '🇸🇴' },
];

export function HrTopBar() {
  const [notifs, setNotifs]               = useState<HrNotification[]>([]);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [notifsOn, setNotifsOn]           = useState(true);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [showLang, setShowLang]           = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const locale    = useLocale();
  const { userData, refreshUser } = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();
  const notifRef  = useRef<HTMLDivElement>(null);
  const langRef   = useRef<HTMLDivElement>(null);

  // Derive page title from the URL segment after the locale
  const pageKey   = pathname.split('/').filter(Boolean)[1] ?? '';
  const pageTitle = PAGE_LABELS[pageKey] ?? 'Bella ERP';

  const role      = userData?.role ?? '';
  const roleLabel = role.replace(/_/g, ' ');
  const initials  = userData?.name
    ? userData.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const fetchNotifs = () => {
    if (!userData) return;
    apiCallFunction<any>({
      url: `${API_BASE_URL}/notifications?limit=10&unread=true`,
      showToast: false,
      returnResponse: true,
      thenFn: r => setNotifs((r?.data?.data ?? []).map((n: HrNotification) => ({ ...n, body: n.body || n.subtitle || '' }))),
      catchFn: () => {},
    });
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    apiCallFunction<{ data: { notificationsEnabled: boolean } }>({
      url: `${API_BASE_URL}/me/notifications/preference`,
      showToast: false,
      thenFn: r => setNotifsOn(r.data?.notificationsEnabled !== false),
      catchFn: () => {},
    });
  }, [userData]);

  const toggleNotifPref = () => {
    if (togglingNotif) return;
    setTogglingNotif(true);
    setNotifsOn(v => !v);
    apiCallFunction({
      url: `${API_BASE_URL}/me/notifications/toggle`,
      method: 'PATCH',
      showToast: false,
      finallyFn: () => setTogglingNotif(false),
    });
  };

  const dismissNotif = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/${id}`, method: 'DELETE', showToast: false });
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  const dismissAll = () => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/read-all`, method: 'PUT', showToast: false });
    setNotifs([]);
  };

  const switchLocale = (code: string) => {
    setShowLang(false);
    const segments = pathname.split('/');
    segments[1] = code;
    router.push(segments.join('/'));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (langRef.current  && !langRef.current.contains(e.target as Node))  setShowLang(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLocale = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <>
      <header className="h-14 shrink-0 border-b border-brand-border bg-brand-bg flex items-center justify-between px-6 gap-4">
        {/* Left: page title */}
        <h1 className="text-[15px] font-bold text-brand-text tracking-tight truncate">{pageTitle}</h1>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Language switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLang(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-text transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showLang && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-brand-border rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => switchLocale(l.code)}
                    className={cn('w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                      l.code === locale
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                        : 'text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-text'
                    )}>
                    <span className="text-base">{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-brand-border" />

          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifs(v => !v)}
              className={cn(
                'relative h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                showNotifs ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-text'
              )}
            >
              {notifsOn ? <Bell className="h-[18px] w-[18px]" /> : <BellOff className="h-[18px] w-[18px] opacity-40" />}
              {notifsOn && notifs.length > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 bg-brand-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {notifs.length > 9 ? '9+' : notifs.length}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-brand-border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-brand-bg-soft border-b border-brand-border">
                  <span className="text-sm font-bold text-brand-text">Notifications</span>
                  {notifs.length > 0 && (
                    <button onClick={dismissAll}
                      className="text-xs text-brand-primary font-medium hover:text-brand-primary-hover flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-brand-border">
                  {notifs.length === 0 ? (
                    <div className="py-10 text-center text-brand-text-muted text-sm">No new notifications</div>
                  ) : notifs.map(n => (
                    <div key={n._id}
                      onClick={() => {
                        apiCallFunction({ url: `${API_BASE_URL}/notifications/${n._id}/read`, method: 'PUT', showToast: false });
                        setNotifs(prev => prev.filter(x => x._id !== n._id));
                        if (n.navigateTo) { setShowNotifs(false); router.push(`/${locale}${n.navigateTo}`); }
                      }}
                      className={cn('flex items-start gap-3 px-4 py-3 hover:bg-brand-bg-soft transition-colors', n.navigateTo ? 'cursor-pointer' : '')}>
                      <div className="h-7 w-7 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="h-3.5 w-3.5 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-text leading-tight">{n.title}</p>
                        <p className="text-xs text-brand-text-secondary mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-xs text-brand-text-muted mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); dismissNotif(n._id); }}
                        className="text-brand-text-muted hover:text-brand-text-secondary shrink-0 mt-1 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-brand-border bg-brand-bg-soft">
                  <span className="text-xs text-brand-text-muted">Notifications {notifsOn ? 'on' : 'off'}</span>
                  <button onClick={toggleNotifPref} disabled={togglingNotif}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                      notifsOn ? 'bg-brand-primary' : 'bg-brand-border-strong'
                    )}>
                    <span className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                      notifsOn ? 'translate-x-4' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-brand-border" />

          {/* User avatar — opens profile modal */}
          {userData && (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-brand-bg-muted transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center shrink-0 overflow-hidden">
                <ProfileAvatar initials={initials} />
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <p className="text-sm font-semibold text-brand-text">{userData.name}</p>
                <p className="text-[11px] text-brand-text-muted capitalize">{roleLabel}</p>
              </div>
            </button>
          )}

        </div>
      </header>

      {/* Profile modal — rendered outside the header so it's not clipped */}
      {showProfile && userData && (
        <ProfileModal
          userData={userData}
          initials={initials}
          onClose={() => setShowProfile(false)}
          onSaved={(updates) => { refreshUser(updates); setShowProfile(false); }}
        />
      )}
    </>
  );
}

// ── Profile avatar (shows photo if available, else initials) ──────────────────
function ProfileAvatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'lg' }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/me/profile/photo`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => setPhotoUrl(URL.createObjectURL(blob)))
      .catch(() => {});
  }, []);

  const cls = size === 'lg'
    ? 'h-20 w-20 rounded-full text-2xl'
    : 'h-full w-full rounded-full text-xs';

  if (photoUrl) {
    return <img src={photoUrl} alt="Profile" className={cn(cls, 'object-cover')} />;
  }
  return <span className={cn('font-bold tracking-wide text-white flex items-center justify-center', cls)}>{initials}</span>;
}

// ── Profile modal ─────────────────────────────────────────────────────────────
interface ProfileModalProps {
  userData: { _id: string; name: string; email: string; role: string; [key: string]: unknown };
  initials: string;
  onClose: () => void;
  onSaved: (updates: { email?: string; [key: string]: unknown }) => void;
}

function ProfileModal({ userData, initials, onClose, onSaved }: ProfileModalProps) {
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState(userData.email ?? '');
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoKey, setPhotoKey]   = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const roleLabel = (userData.role ?? '').replace(/_/g, ' ');

  useEffect(() => {
    apiCallFunction<{ data: { phone?: string; email?: string } }>({
      url: `${API_BASE_URL}/me/profile`,
      showToast: false,
      thenFn: r => {
        if (r.data?.phone) setPhone(r.data.phone);
        if (r.data?.email) setEmail(r.data.email);
      },
      catchFn: () => {},
    });
  }, []);

  const save = () => {
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/me/profile`,
      method: 'PATCH',
      data: { phone, email },
      thenFn: () => onSaved({ email }),
      finallyFn: () => setSaving(false),
    });
  };

  const uploadPhoto = (file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    setUploading(true);
    const token = sessionStorage.getItem('token');
    fetch(`${API_BASE_URL}/me/profile/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
      .then(r => r.json())
      .then(() => setPhotoKey(k => k + 1))
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-base">My Profile</h2>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-20 w-20 rounded-full bg-brand-primary shadow-lg overflow-hidden">
              <ProfileAvatar key={photoKey} initials={initials} size="lg" />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {uploading ? 'Uploading…' : 'Change Photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
            />
          </div>

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Full Name</label>
              <p className="text-sm font-semibold">{userData.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Role</label>
              <p className="text-sm font-semibold capitalize">{roleLabel}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +254712345678"
                className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="text-sm text-foreground/40 hover:text-foreground px-4 py-2 rounded-xl">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-semibold bg-brand-primary text-white px-5 py-2 rounded-xl disabled:opacity-50 hover:brightness-110"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
