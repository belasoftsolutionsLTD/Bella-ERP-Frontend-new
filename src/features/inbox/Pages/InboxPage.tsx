'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Inbox, Check, X, MailOpen, Mail,
  Calendar, Briefcase, Clock, FileText, BarChart2,
  UserCheck, ClipboardList, DollarSign, ClipboardCheck,
  Bell, Filter, RefreshCw, Trash2,
} from 'lucide-react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InboxItem {
  _id: string;
  type: string;
  subType: string;
  title: string;
  subtitle: string;
  createdAt: string;
  status: 'unread' | 'read' | 'actioned' | 'dismissed';
  requiresAction: boolean;
  actionTaken: string | null;
  referenceId: string | null;
  referenceModel: string | null;
  priority: string;
}

interface InboxItemDetail extends InboxItem {
  referenceData: Record<string, unknown> | null;
}


// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  leave:       { label: 'Leave',       color: '#3b82f6', bg: '#dbeafe20', icon: Calendar },
  expense:     { label: 'Expense',     color: '#22c55e', bg: '#dcfce720', icon: Briefcase },
  timesheet:   { label: 'Timesheet',   color: '#f59e0b', bg: '#fef3c720', icon: Clock },
  document:    { label: 'Document',    color: '#8b5cf6', bg: '#ede9fe20', icon: FileText },
  performance: { label: 'Performance', color: '#ec4899', bg: '#fce7f320', icon: BarChart2 },
  recruitment: { label: 'Recruitment', color: '#f97316', bg: '#fff7ed20', icon: UserCheck },
  onboarding:  { label: 'Onboarding',  color: '#10b981', bg: '#ecfdf520', icon: ClipboardList },
  payroll:     { label: 'Payroll',     color: '#16a34a', bg: '#f0fdf420', icon: DollarSign },
  survey:      { label: 'Survey',      color: '#6366f1', bg: '#eff6ff20', icon: ClipboardCheck },
  general:     { label: 'General',     color: '#64748b', bg: '#f1f5f920', icon: Bell },
};

const TABS = ['all', 'pending', 'notifications', 'done'] as const;
type Tab = typeof TABS[number];

const TYPE_FILTERS = ['all', 'leave', 'expense', 'timesheet', 'document', 'performance', 'recruitment', 'onboarding', 'payroll', 'survey'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(str: string) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Item Row ──────────────────────────────────────────────────────────────────

function ItemRow({
  item, selected, onSelect, onQuickAction, bulkMode, bulkSelected, onBulkToggle,
}: {
  item: InboxItem;
  selected: boolean;
  onSelect: () => void;
  onQuickAction: (id: string, action: 'approved' | 'declined') => void;
  bulkMode: boolean;
  bulkSelected: boolean;
  onBulkToggle: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
  const Icon = cfg.icon;
  const isUnread = item.status === 'unread';
  const isPending = item.requiresAction && (item.status === 'unread' || item.status === 'read');

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors rounded-xl"
      style={{
        background: selected ? '#1e1b4b' : isUnread ? '#1e293b' : 'transparent',
        borderLeft: isUnread ? '3px solid #6366f1' : '3px solid transparent',
      }}
    >
      {/* Bulk checkbox */}
      {bulkMode && (
        <div
          onClick={e => { e.stopPropagation(); onBulkToggle(); }}
          className={`h-4 w-4 rounded border flex items-center justify-center mt-1 shrink-0 ${bulkSelected ? 'bg-brand-primary border-brand-primary' : 'border-brand-border-strong bg-transparent'}`}
        >
          {bulkSelected && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
      )}

      {/* Type icon */}
      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-brand-text truncate">{item.title}</div>
        <div className="text-[12px] text-brand-text-secondary truncate mt-0.5">{item.subtitle}</div>
        <div className="text-[11px] text-brand-text-muted mt-1">{timeAgo(item.createdAt)}</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 shrink-0 mt-1">
        {isPending && !bulkMode && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onQuickAction(item._id, 'approved'); }}
              className="h-7 w-7 rounded-full bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition-colors"
              title="Approve"
            >
              <Check className="h-3.5 w-3.5 text-green-400" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onQuickAction(item._id, 'declined'); }}
              className="h-7 w-7 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
              title="Decline"
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}
        {isUnread && !isPending && (
          <span className="h-2 w-2 rounded-full bg-brand-primary" />
        )}
        {item.status === 'actioned' && (
          <Check className="h-3.5 w-3.5 text-green-400" />
        )}
      </div>
    </div>
  );
}

// ── Detail Panel: Leave ───────────────────────────────────────────────────────

function LeaveDetail({ item, onAction }: { item: InboxItemDetail; onAction: (action: string, reason?: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const ref = item.referenceData as Record<string, unknown> | null;
  const emp = ref?.employee as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      {/* Employee card */}
      {emp && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0f172a' }}>
          <div className="h-14 w-14 rounded-full bg-brand-primary/30 flex items-center justify-center text-xl font-bold text-indigo-300">
            {String(emp.fullName || '?')[0]}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-brand-text">{String(emp.fullName || '—')}</div>
            <div className="text-[12px] text-brand-text-secondary">{String(emp.designation || '')} · {String(emp.department || '')}</div>
          </div>
        </div>
      )}

      {/* Details */}
      {ref && (
        <div className="rounded-xl p-4 space-y-2.5" style={{ background: '#0f172a' }}>
          {[
            { label: 'Leave type', value: String(ref.leaveType || '—') },
            { label: 'From', value: formatDate(String(ref.startDate || '')) },
            { label: 'To', value: formatDate(String(ref.endDate || '')) },
            { label: 'Total days', value: `${ref.numberOfDays} working days` },
            { label: 'Reason', value: String(ref.reason || '—') },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-[13px]">
              <span className="text-brand-text-secondary">{label}</span>
              <span className="text-brand-text font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {item.requiresAction && item.status !== 'actioned' && (
        <div className="space-y-2">
          {!declining ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onAction('approved')}
                className="h-12 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <Check className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => setDeclining(true)}
                className="h-12 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold flex items-center justify-center gap-2 transition-colors">
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for declining (optional)"
                rows={3}
                className="w-full rounded-xl p-3 text-[13px] bg-brand-bg-muted text-brand-text border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDeclining(false)}
                  className="h-10 rounded-xl border border-brand-border-strong text-brand-text-secondary hover:bg-brand-bg-muted text-[13px] transition-colors">
                  Cancel
                </button>
                <button onClick={() => onAction('declined', reason)}
                  className="h-10 rounded-xl bg-brand-danger hover:bg-brand-danger/90 text-white font-semibold text-[13px] transition-colors">
                  Confirm Decline
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail Panel: Expense ─────────────────────────────────────────────────────

function ExpenseDetail({ item, onAction }: { item: InboxItemDetail; onAction: (action: string, reason?: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const ref = item.referenceData as Record<string, unknown> | null;
  const emp = ref?.employee as Record<string, unknown> | null;

  return (
    <div className="space-y-4">
      {emp && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0f172a' }}>
          <div className="h-14 w-14 rounded-full bg-green-600/30 flex items-center justify-center text-xl font-bold text-green-300">
            {String(emp.fullName || '?')[0]}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-brand-text">{String(emp.fullName || '—')}</div>
            <div className="text-[12px] text-brand-text-secondary">{String(emp.designation || '')} · {String(emp.department || '')}</div>
          </div>
        </div>
      )}

      {ref && (
        <div className="rounded-xl p-4 space-y-2.5" style={{ background: '#0f172a' }}>
          <div className="text-[28px] font-black text-brand-text">
            {String(ref.currency || 'KES')} {Number(ref.amount || 0).toLocaleString('en-KE')}
          </div>
          {[
            { label: 'Category', value: String(ref.category || ref.type || '—') },
            { label: 'Description', value: String(ref.description || '—') },
            { label: 'Date', value: ref.date ? formatDate(String(ref.date)) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-[13px]">
              <span className="text-brand-text-secondary">{label}</span>
              <span className="text-brand-text font-medium text-right">{value}</span>
            </div>
          ))}
          {Boolean(ref.isPolicyViolation) && (
            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[12px] text-red-400">
              ⚠ Policy violation: {String(ref.violationReason || '')}
            </div>
          )}
        </div>
      )}

      {item.requiresAction && item.status !== 'actioned' && (
        <div className="space-y-2">
          {!declining ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onAction('approved')}
                className="h-12 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <Check className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => setDeclining(true)}
                className="h-12 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold flex items-center justify-center gap-2 transition-colors">
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Reason for declining" rows={2}
                className="w-full rounded-xl p-3 text-[13px] bg-brand-bg-muted text-brand-text border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDeclining(false)}
                  className="h-10 rounded-xl border border-brand-border-strong text-brand-text-secondary hover:bg-brand-bg-muted text-[13px] transition-colors">Cancel</button>
                <button onClick={() => onAction('declined', reason)}
                  className="h-10 rounded-xl bg-brand-danger hover:bg-brand-danger/90 text-white font-semibold text-[13px] transition-colors">Confirm Decline</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail Panel: Timesheet ───────────────────────────────────────────────────

function TimesheetDetail({ item, onAction }: { item: InboxItemDetail; onAction: (action: string, reason?: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const ref = item.referenceData as Record<string, unknown> | null;
  const emp = ref?.employee as Record<string, unknown> | null;
  const days = (ref?.days as Array<{ date: string; hours: number }>) || [];

  return (
    <div className="space-y-4">
      {emp && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0f172a' }}>
          <div className="h-14 w-14 rounded-full bg-amber-600/30 flex items-center justify-center text-xl font-bold text-amber-300">
            {String(emp.fullName || '?')[0]}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-brand-text">{String(emp.fullName || '—')}</div>
            <div className="text-[12px] text-brand-text-secondary">{String(emp.designation || '')} · {String(emp.department || '')}</div>
          </div>
        </div>
      )}

      {ref && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#0f172a' }}>
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-text-secondary">Week</span>
            <span className="text-brand-text font-medium">{String(ref.weekStart || '—')} – {String(ref.weekEnd || '—')}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-brand-text-secondary">Total hours</span>
            <span className="text-[20px] font-black text-brand-text">{Number(ref.totalHours || 0).toFixed(1)}h</span>
          </div>
          {days.length > 0 && (
            <div className="grid grid-cols-5 gap-1 mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                <div key={d} className="text-center">
                  <div className="text-[10px] text-brand-text-muted mb-0.5">{d}</div>
                  <div className="rounded-lg py-1 text-[12px] font-semibold" style={{ background: '#1e293b', color: days[i]?.hours ? '#f1f5f9' : '#475569' }}>
                    {days[i]?.hours ? `${days[i].hours}h` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {item.requiresAction && item.status !== 'actioned' && (
        <div className="space-y-2">
          {!declining ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onAction('approved')}
                className="h-12 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <Check className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => setDeclining(true)}
                className="h-12 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold flex items-center justify-center gap-2 transition-colors">
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Reason for rejection" rows={2}
                className="w-full rounded-xl p-3 text-[13px] bg-brand-bg-muted text-brand-text border border-brand-border-strong placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDeclining(false)}
                  className="h-10 rounded-xl border border-brand-border-strong text-brand-text-secondary hover:bg-brand-bg-muted text-[13px] transition-colors">Cancel</button>
                <button onClick={() => onAction('declined', reason)}
                  className="h-10 rounded-xl bg-brand-danger hover:bg-brand-danger/90 text-white font-semibold text-[13px] transition-colors">Confirm Reject</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Generic Notification Detail ───────────────────────────────────────────────

function GenericDetail({ item }: { item: InboxItemDetail }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
  const Icon = cfg.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#0f172a' }}>
        <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
          <Icon className="h-5 w-5" style={{ color: cfg.color }} />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-brand-text">{item.title}</div>
          <div className="text-[13px] text-brand-text-secondary mt-0.5">{item.subtitle}</div>
        </div>
      </div>
      <div className="text-[12px] text-brand-text-muted">
        {new Date(item.createdAt).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })}
      </div>
    </div>
  );
}

// ── Detail Panel Router ───────────────────────────────────────────────────────

function DetailPanel({
  item, onAction, onDismiss,
}: {
  item: InboxItemDetail | null;
  onAction: (id: string, action: string, reason?: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-brand-bg-soft">
        <Inbox className="h-14 w-14 text-slate-700" />
        <p className="text-brand-text-muted text-[14px]">Select an item to view details</p>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-brand-bg-soft">
      {/* Header */}
      <div className="p-5 border-b border-brand-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
            {item.requiresAction && item.status !== 'actioned' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400">
                Pending Approval
              </span>
            )}
            {item.status === 'actioned' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/20 text-green-400">
                {item.actionTaken || 'Actioned'}
              </span>
            )}
          </div>
          <button
            onClick={() => onDismiss(item._id)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-bg-soft transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <h2 className="text-[16px] font-bold text-brand-text">{item.title}</h2>
        <p className="text-[13px] text-brand-text-secondary mt-0.5">{item.subtitle}</p>
        <p className="text-[12px] text-brand-text-muted mt-1">{new Date(item.createdAt).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        {item.type === 'leave' ? (
          <LeaveDetail item={item} onAction={(a, r) => onAction(item._id, a, r)} />
        ) : item.type === 'expense' ? (
          <ExpenseDetail item={item} onAction={(a, r) => onAction(item._id, a, r)} />
        ) : item.type === 'timesheet' ? (
          <TimesheetDetail item={item} onAction={(a, r) => onAction(item._id, a, r)} />
        ) : (
          <GenericDetail item={item} />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN INBOX PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function InboxPage() {
  useAuth();

  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [, setTotal] = useState(0);
  const [counts, setCounts] = useState({ unread: 0, pending: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InboxItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { limit: 50 };
    if (tab !== 'all') params.tab = tab;
    if (typeFilter !== 'all') params.type = typeFilter;

    apiCallFunction<any>({
      url: `${API_BASE_URL}/inbox`,
      params,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => {
        setItems(res?.data?.data || []);
        setTotal(res?.data?.pagination?.total || 0);
      },
      finallyFn: () => setLoading(false),
    });
  }, [tab, typeFilter]);

  const fetchCounts = useCallback(() => {
    apiCallFunction<{ data: { unread: number; pending: number } }>({
      url: `${API_BASE_URL}/inbox/count`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => {
        if (res?.data) setCounts(res.data);
      },
    });
  }, []);

  useEffect(() => { fetchItems(); fetchCounts(); }, [fetchItems, fetchCounts]);

  // Count per tab (simplified from main list)
  useEffect(() => {
    const pending = items.filter(i => i.requiresAction && (i.status === 'unread' || i.status === 'read')).length;
    const notifications = items.filter(i => !i.requiresAction).length;
    const done = items.filter(i => i.status === 'actioned' || i.status === 'dismissed').length;
    setTabCounts({ all: items.length, pending, notifications, done });
  }, [items]);

  const selectItem = useCallback((id: string) => {
    setSelectedId(id);
    apiCallFunction<{ data: InboxItemDetail }>({
      url: `${API_BASE_URL}/inbox/${id}`,
      showToast: false,
      returnResponse: true,
      thenFn: (res) => {
        if (res?.data) {
          setDetail(res.data);
          // Update the item status in list to 'read'
          setItems(prev => prev.map(i => i._id === id && i.status === 'unread' ? { ...i, status: 'read' } : i));
        }
      },
    });
  }, []);

  const handleAction = useCallback((id: string, action: string, reason?: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/inbox/${id}/action`,
      method: 'PUT',
      data: { action, reason },
      showToast: true,
      thenFn: () => {
        setItems(prev => prev.map(i => i._id === id ? { ...i, status: 'actioned', actionTaken: action } : i));
        setDetail(prev => prev && prev._id === id ? { ...prev, status: 'actioned', actionTaken: action } : prev);
        fetchCounts();
      },
    });
  }, [fetchCounts]);

  const handleDismiss = useCallback((id: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/inbox/${id}`,
      method: 'DELETE',
      showToast: false,
      thenFn: () => {
        setItems(prev => prev.filter(i => i._id !== id));
        if (selectedId === id) { setSelectedId(null); setDetail(null); }
        fetchCounts();
      },
    });
  }, [selectedId, fetchCounts]);

  const handleMarkAllRead = useCallback(() => {
    apiCallFunction({
      url: `${API_BASE_URL}/inbox/read-all`,
      method: 'PUT',
      showToast: true,
      thenFn: () => {
        setItems(prev => prev.map(i => i.status === 'unread' ? { ...i, status: 'read' } : i));
        fetchCounts();
      },
    });
  }, [fetchCounts]);

  const handleBulkAction = useCallback((action: string) => {
    const ids = [...bulkSelected];
    if (!ids.length) return;
    apiCallFunction({
      url: `${API_BASE_URL}/inbox/bulk`,
      method: 'POST',
      data: { ids, action },
      showToast: true,
      thenFn: () => {
        if (action === 'dismiss') {
          setItems(prev => prev.filter(i => !bulkSelected.has(i._id)));
          if (selectedId && bulkSelected.has(selectedId)) { setSelectedId(null); setDetail(null); }
        } else if (action === 'mark_read') {
          setItems(prev => prev.map(i => bulkSelected.has(i._id) ? { ...i, status: 'read' } : i));
        }
        setBulkSelected(new Set());
        setBulkMode(false);
        fetchCounts();
      },
    });
  }, [bulkSelected, selectedId, fetchCounts]);

  const toggleBulkSelect = useCallback((id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleQuickAction = useCallback((id: string, action: 'approved' | 'declined') => {
    handleAction(id, action);
  }, [handleAction]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-bold text-brand-text">Inbox</h1>
          {counts.unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
              {counts.unread} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text transition-colors">
            <MailOpen className="h-3.5 w-3.5" /> Mark all read
          </button>
          <button onClick={() => { setBulkMode(v => !v); setBulkSelected(new Set()); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors ${bulkMode ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text'}`}>
            <Filter className="h-3.5 w-3.5" /> {bulkMode ? 'Exit select' : 'Select'}
          </button>
          <button onClick={() => { fetchItems(); fetchCounts(); }}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-brand-text-secondary hover:bg-brand-bg-soft hover:text-brand-text transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col shrink-0 rounded-2xl overflow-hidden border border-brand-border/60" style={{ width: 340, background: '#1e293b' }}>
          {/* Tabs */}
          <div className="flex border-b border-brand-border/60 px-1 pt-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[12px] font-semibold capitalize transition-colors relative rounded-t-lg ${tab === t ? 'text-indigo-400' : 'text-brand-text-muted hover:text-brand-text-secondary'}`}
              >
                {t}
                {tabCounts[t] > 0 && (
                  <span className="ml-1 text-[10px] text-brand-text-muted">({tabCounts[t]})</span>
                )}
                {tab === t && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="px-3 py-2.5 border-b border-brand-border/60">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-[12px] bg-brand-bg-soft/60 text-brand-text-secondary border border-brand-border/60 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              {TYPE_FILTERS.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Types' : TYPE_CONFIG[t]?.label || t}</option>
              ))}
            </select>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 text-brand-text-muted animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Mail className="h-8 w-8 text-slate-700" />
                <p className="text-[13px] text-brand-text-muted">No items here</p>
              </div>
            ) : (
              items.map(item => (
                <ItemRow
                  key={item._id}
                  item={item}
                  selected={selectedId === item._id}
                  onSelect={() => selectItem(item._id)}
                  onQuickAction={handleQuickAction}
                  bulkMode={bulkMode}
                  bulkSelected={bulkSelected.has(item._id)}
                  onBulkToggle={() => toggleBulkSelect(item._id)}
                />
              ))
            )}
          </div>

          {/* Bulk actions bar */}
          {bulkMode && bulkSelected.size > 0 && (
            <div className="border-t border-brand-border/60 px-4 py-3 flex items-center gap-2 flex-wrap bg-brand-bg-soft/50 rounded-b-2xl">
              <span className="text-[12px] text-brand-text-secondary mr-1">{bulkSelected.size} selected</span>
              <button onClick={() => handleBulkAction('mark_read')}
                className="px-2.5 py-1 rounded-lg bg-brand-primary/30 text-indigo-400 text-[11px] hover:bg-brand-primary-hover/50 transition-colors">
                Mark read
              </button>
              <button onClick={() => handleBulkAction('dismiss')}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[11px] hover:bg-red-500/30 transition-colors">
                Dismiss
              </button>
              <button onClick={() => { setBulkSelected(new Set()); setBulkMode(false); }}
                className="px-2.5 py-1 rounded-lg bg-brand-bg-muted text-brand-text-secondary text-[11px] hover:bg-brand-border-strong transition-colors ml-auto">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── DETAIL PANEL ── */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-brand-border/60 min-h-0">
          <DetailPanel
            item={detail}
            onAction={handleAction}
            onDismiss={handleDismiss}
          />
        </div>
      </div>
    </div>
  );
}
