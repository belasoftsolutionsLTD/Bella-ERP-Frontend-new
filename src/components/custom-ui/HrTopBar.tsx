'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, X, LogOut, Globe, ChevronDown, Camera, Save, Loader2, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { cn } from '@/lib/utils';

interface HrNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}
interface NotifEnvelope { data: HrNotification[] }

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
  const [notifs, setNotifs]             = useState<HrNotification[]>([]);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [notifsOn, setNotifsOn]         = useState(true);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [showLang, setShowLang]         = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const locale    = useLocale();
  const { logout, userData, refreshUser } = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();
  const notifRef  = useRef<HTMLDivElement>(null);
  const langRef   = useRef<HTMLDivElement>(null);

  const role      = userData?.role ?? '';
  const roleLabel = role.replace(/_/g, ' ');
  const initials  = userData?.name
    ? userData.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const fetchNotifs = () => {
    if (!userData) return;
    apiCallFunction<NotifEnvelope>({
      url: `${API_BASE_URL}/hr/notifications`,
      showToast: false,
      thenFn: r => setNotifs(r.data ?? []),
      catchFn: () => {},
    });
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60000);
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
    apiCallFunction({ url: `${API_BASE_URL}/hr/notifications/${id}/read`, method: 'PATCH', showToast: false });
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  const dismissAll = () => {
    apiCallFunction({ url: `${API_BASE_URL}/hr/notifications/read-all`, method: 'PATCH', showToast: false });
    setNotifs([]);
  };

  const switchLocale = (code: string) => {
    setShowLang(false);
    const segments = pathname.split('/');
    segments[1] = code;
    router.push(segments.join('/'));
  };

  const handleLogout = () => { logout(); router.push(`/${locale}/login`); };

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
    <header className="h-14 shrink-0 border-b bg-white flex items-center justify-end px-6 gap-2 shadow-sm">

      {/* Language switcher */}
      <div ref={langRef} className="relative">
        <button
          onClick={() => setShowLang(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-foreground/60 hover:bg-gray-100 hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showLang && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
            {LOCALES.map(l => (
              <button key={l.code} onClick={() => switchLocale(l.code)}
                className={cn('w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  l.code === locale
                    ? 'bg-primary/5 text-primary font-semibold'
                    : 'text-foreground/70 hover:bg-gray-50'
                )}>
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200 mx-1" />

      {/* Notification bell */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setShowNotifs(v => !v)}
          className={cn(
            'relative h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
            showNotifs ? 'bg-primary/10 text-primary' : 'text-foreground/50 hover:bg-gray-100 hover:text-foreground'
          )}
        >
          {notifsOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 opacity-40" />}
          {notifsOn && notifs.length > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {notifs.length > 9 ? '9+' : notifs.length}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              {notifs.length > 0 && (
                <button onClick={dismissAll}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-foreground/30 text-sm">No new notifications</div>
              ) : notifs.map(n => (
                <div key={n._id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{n.title}</p>
                    <p className="text-xs text-foreground/50 mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-xs text-foreground/30 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => dismissNotif(n._id)}
                    className="text-foreground/20 hover:text-foreground/60 shrink-0 mt-1 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50">
              <span className="text-xs text-foreground/50">Notifications {notifsOn ? 'on' : 'off'}</span>
              <button onClick={toggleNotifPref} disabled={togglingNotif}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                  notifsOn ? 'bg-primary' : 'bg-gray-300'
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

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200 mx-1" />

      {/* User chip — clickable to open profile modal */}
      {userData && (
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2.5 pl-1 rounded-xl px-2 py-1 hover:bg-gray-100 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <ProfileAvatar initials={initials} />
          </div>
          <div className="hidden sm:block leading-tight text-left">
            <p className="text-sm font-semibold text-foreground">{userData.name}</p>
            <p className="text-[11px] text-foreground/40 capitalize">{roleLabel}</p>
          </div>
        </button>
      )}

      {/* Profile modal */}
      {showProfile && userData && (
        <ProfileModal
          userData={userData}
          initials={initials}
          onClose={() => setShowProfile(false)}
          onSaved={(updates) => { refreshUser(updates); setShowProfile(false); }}
        />
      )}

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
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
            <div className="relative h-20 w-20 rounded-full bg-primary shadow-lg overflow-hidden">
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
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
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
                className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-foreground/50">Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +254712345678"
                className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-5 py-2 rounded-xl disabled:opacity-50 hover:brightness-110"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
