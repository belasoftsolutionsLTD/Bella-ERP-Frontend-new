'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Check, CheckCheck, Trash2, RefreshCw,
  Calendar, AlertCircle, MessageSquare,
  Award, Clock, DollarSign, Users, X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  subtitle?: string;
  isRead: boolean;
  navigateTo: string | null;
  createdAt: string;
}

interface NotifPage {
  records: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  leave:       Calendar,
  expense:     DollarSign,
  attendance:  Clock,
  performance: Award,
  hr:          Users,
  message:     MessageSquare,
  alert:       AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  leave:       '#6366f1',
  expense:     '#f59e0b',
  attendance:  '#3b82f6',
  performance: '#a78bfa',
  hr:          '#22c55e',
  message:     '#ec4899',
  alert:       '#f87171',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

// ── Notification Row ──────────────────────────────────────────────────────────

function NotifRow({
  notif, selected, onSelect, onMarkRead, onDismiss, onNavigate,
}: {
  notif: Notification;
  selected: boolean;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (id: string, navigateTo: string | null) => void;
}) {
  const Icon = TYPE_ICONS[notif.type] || Bell;
  const color = TYPE_COLORS[notif.type] || '#6366f1';

  return (
    <div
      onClick={() => onNavigate(notif._id, notif.navigateTo)}
      className={`flex items-start gap-3 px-5 py-4 border-b border-brand-border/50 hover:bg-brand-bg-muted/20 transition-colors relative group ${
        !notif.isRead ? 'bg-brand-primary/5' : ''
      } ${notif.navigateTo ? 'cursor-pointer' : ''}`}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <span className="absolute left-0 inset-y-4 w-0.5 rounded-r-full bg-brand-primary" />
      )}

      {/* Checkbox */}
      <button onClick={() => onSelect(notif._id)}
        className={`shrink-0 mt-0.5 h-4 w-4 rounded border transition-colors ${selected ? 'bg-brand-primary border-brand-primary' : 'border-brand-border-strong bg-brand-bg-soft'} flex items-center justify-center`}>
        {selected && <Check className="h-2.5 w-2.5 text-white" />}
      </button>

      {/* Icon */}
      <div className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[13px] font-semibold leading-tight ${notif.isRead ? 'text-brand-text-secondary' : 'text-brand-text'}`}>
            {notif.title}
          </span>
          <span className="text-[11px] text-brand-text-muted shrink-0">{timeAgo(notif.createdAt)}</span>
        </div>
        {(notif.body || notif.subtitle) && (
          <p className="text-[12px] text-brand-text-muted mt-0.5 leading-snug">{notif.body || notif.subtitle}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.isRead && (
          <button onClick={() => onMarkRead(notif._id)} title="Mark read"
            className="h-7 w-7 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-indigo-400 hover:bg-brand-primary-hover/10 transition-colors">
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => onDismiss(notif._id)} title="Dismiss"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-red-400 hover:bg-red-600/10 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [data, setData] = useState<NotifPage | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (typeFilter !== 'all') params.type = typeFilter;
    if (readFilter === 'unread') params.unread = 'true';

    apiCallFunction<any>({
      url: `${API_BASE_URL}/notifications`,
      params,
      showToast: false,
      returnResponse: true,
      thenFn: r => setData({
        records:    (r?.data?.data ?? []).map((n: Notification) => ({ ...n, body: n.body || n.subtitle || '' })),
        total:      r?.data?.pagination?.total      ?? 0,
        page:       r?.data?.pagination?.page       ?? 1,
        totalPages: r?.data?.pagination?.pages ?? 1,
      }),
    }).finally(() => setLoading(false));
  }, [page, typeFilter, readFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markRead = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/${id}/read`, method: 'PUT', showToast: false, thenFn: fetchAll });
  };

  const dismiss = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/${id}`, method: 'DELETE', showToast: false, thenFn: fetchAll });
  };

  const markAllRead = () => {
    apiCallFunction({ url: `${API_BASE_URL}/notifications/read-all`, method: 'PUT', showToast: false, thenFn: fetchAll });
  };

  const bulkDismiss = () => {
    const ids = Array.from(selected);
    Promise.all(ids.map(id => apiCallFunction({ url: `${API_BASE_URL}/notifications/${id}`, method: 'DELETE', showToast: false }))).then(fetchAll);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    if (selected.size === data.records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.records.map(n => n._id)));
    }
  };

  const handleNavigate = (id: string, navigateTo: string | null) => {
    markRead(id);
    if (navigateTo) router.push(`/${locale}${navigateTo}`);
  };

  const unreadCount = data?.records.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-full" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-brand-text">Notifications</h1>
          <p className="text-[13px] text-brand-text-secondary mt-0.5">
            {data?.total ?? 0} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text transition-colors border border-brand-border">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-brand-border text-brand-text-secondary text-[13px] font-semibold hover:bg-brand-bg-soft transition-colors">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-bg-soft">
        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-brand-border">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-8 px-3 rounded-lg bg-brand-bg-soft text-brand-text-secondary text-[12px] border border-brand-border focus:outline-none">
            <option value="all">All Types</option>
            {Object.keys(TYPE_ICONS).map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button onClick={() => setReadFilter(v => v === 'all' ? 'unread' : 'all')}
            className={`h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors ${
              readFilter === 'unread' ? 'bg-brand-primary/20 border-brand-primary/50 text-indigo-400' : 'bg-brand-bg-soft border-brand-border text-brand-text-secondary hover:text-brand-text'
            }`}>
            Unread only
          </button>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[12px] text-brand-text-secondary">{selected.size} selected</span>
              <button onClick={bulkDismiss}
                className="flex items-center gap-1 h-8 px-3 rounded-lg bg-red-600/20 text-red-400 text-[12px] font-semibold hover:bg-red-600/30 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Dismiss
              </button>
              <button onClick={() => setSelected(new Set())}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Select all row */}
        {data && data.records.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-brand-border/50 bg-brand-bg-soft/30">
            <button onClick={selectAll}
              className={`h-4 w-4 rounded border transition-colors flex items-center justify-center ${
                selected.size === data.records.length && data.records.length > 0 ? 'bg-brand-primary border-brand-primary' : 'border-brand-border-strong'
              }`}>
              {selected.size === data.records.length && data.records.length > 0 && <Check className="h-2.5 w-2.5 text-white" />}
            </button>
            <span className="text-[11px] text-brand-text-muted">Select all on this page</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-brand-text-muted">Loading…</div>
        ) : data?.records.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-8 w-8 mx-auto mb-2 text-brand-text-muted" />
            <p className="text-brand-text-muted">No notifications</p>
          </div>
        ) : (
          data?.records.map(n => (
            <NotifRow key={n._id} notif={n} selected={selected.has(n._id)}
              onSelect={toggleSelect} onMarkRead={markRead} onDismiss={dismiss} onNavigate={handleNavigate} />
          ))
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
            <span className="text-[12px] text-brand-text-muted">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button disabled={data.page <= 1} onClick={() => setPage(p => p - 1)}
                className="h-8 px-3 rounded-lg border border-brand-border text-brand-text-secondary text-[12px] hover:bg-brand-bg-muted disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button disabled={data.page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 rounded-lg border border-brand-border text-brand-text-secondary text-[12px] hover:bg-brand-bg-muted disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
