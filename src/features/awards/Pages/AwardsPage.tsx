'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy, Star, Heart, MessageCircle,
  Plus, X, Search, Users, Trash2, ChevronLeft, ChevronRight,
  Award, Loader2, Pencil, Medal, Crown,
  TrendingUp, Send, Check, Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/StatusBadge';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Value { _id: string; name: string; description?: string; color: string; icon?: string; order: number }
interface Kudos {
  _id: string;
  granterId: string;
  granterName?: string;
  recipientIds: string[];
  recipientNames?: string[];
  valueName?: string;
  valueColor?: string;
  message: string;
  reactions: { type: string; employeeId: string }[];
  comments: { _id: string; content: string; authorName?: string; createdAt: string }[];
  isPublic: boolean;
  createdAt: string;
}
interface LeaderEntry { employeeId: string; employeeName: string; designation?: string; kudosReceived: number; rank: number }
interface Program { _id: string; name: string; description?: string; status: string; deadline?: string; nominationCount: number }
interface Nomination { _id: string; nomineeId: string; nomineeName?: string; nominatorId: string; nominatorName?: string; justification: string; isWinner?: boolean }
interface AwardType { _id: string; name: string; description?: string; category?: string; repeatInterval?: string; nextDueDate?: string }
interface EmpAward  { _id: string; employeeName: string; staffNumber?: string; department?: string; awardTypeName: string; year: number; awardedBy: string; awardedAt: string }

type Tab = 'feed' | 'leaderboard' | 'programs' | 'values' | 'certifications';

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const RANK_META = (rank: number) => {
  if (rank === 1) return { icon: '🥇', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20' };
  if (rank === 2) return { icon: '🥈', color: '#94a3b8', bg: 'bg-slate-500/10 border-slate-500/20' };
  if (rank === 3) return { icon: '🥉', color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20' };
  return { icon: `#${rank}`, color: '#6366f1', bg: 'bg-brand-primary/10 border-brand-primary/20' };
};

const AWARD_STATUS_MAP: Record<string, Status> = {
  draft: 'draft', active: 'active', closed: 'closed', completed: 'completed',
};

function Avatar({ name, size = 'md', color }: { name?: string; size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-base' : 'h-9 w-9 text-xs';
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white shrink-0', sz)}
      style={{ backgroundColor: color || '#6366f1' }}>
      {initials(name)}
    </div>
  );
}

// ── Kudos Card ─────────────────────────────────────────────────────────────────

function KudosCard({ kudos, currentUserId, onReact, onDelete }: {
  kudos: Kudos; currentUserId?: string;
  onReact: (id: string, type: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [localKudos, setLocalKudos] = useState(kudos);

  const submitComment = () => {
    if (!comment.trim()) return;
    setSending(true);
    apiCallFunction({
      url: `${API_BASE_URL}/recognition/kudos/${kudos._id}/comment`,
      method: 'POST',
      data: { content: comment },
      thenFn: (r: any) => {
        setLocalKudos(k => ({ ...k, comments: [...k.comments, r.data] }));
        setComment('');
      },
      finallyFn: () => setSending(false),
    });
  };

  const reactionTypes = [{ type: 'clap', emoji: '👏' }, { type: 'heart', emoji: '❤️' }, { type: 'celebrate', emoji: '🎉' }];
  const isOwner = kudos.granterId === currentUserId;

  return (
    <div className="bg-brand-bg-soft border border-brand-border rounded-2xl overflow-hidden">
      {/* Value badge strip */}
      {kudos.valueName && (
        <div className="h-1.5" style={{ backgroundColor: kudos.valueColor || '#6366f1' }} />
      )}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={kudos.granterName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-brand-text">{kudos.granterName || 'Someone'}</span>
              <span className="text-xs text-brand-text-muted">gave kudos to</span>
              {kudos.recipientNames?.map(n => (
                <span key={n} className="text-sm font-bold text-indigo-400">{n}</span>
              ))}
            </div>
            {kudos.valueName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-1"
                style={{ backgroundColor: (kudos.valueColor || '#6366f1') + '22', color: kudos.valueColor || '#6366f1' }}>
                ✦ {kudos.valueName}
              </span>
            )}
            <p className="text-[11px] text-brand-text-muted mt-0.5">{timeAgo(kudos.createdAt)}</p>
          </div>
          {isOwner && (
            <button onClick={() => onDelete(kudos._id)} className="p-1.5 text-brand-text-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-brand-text-secondary leading-relaxed italic mb-4">&ldquo;{kudos.message}&rdquo;</p>

        {/* Reactions */}
        <div className="flex items-center gap-1 flex-wrap">
          {reactionTypes.map(({ type, emoji }) => {
            const count = localKudos.reactions.filter(r => r.type === type).length;
            const mine = localKudos.reactions.some(r => r.type === type && r.employeeId === currentUserId);
            return (
              <button key={type} onClick={() => onReact(kudos._id, type)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                  mine ? 'bg-brand-primary/20 border-brand-primary/40 text-indigo-300' : 'bg-brand-bg-soft border-brand-border text-brand-text-secondary hover:border-brand-border-strong',
                )}>
                {emoji} {count > 0 && count}
              </button>
            );
          })}
          <button onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-brand-text-muted hover:text-brand-text-secondary border border-brand-border hover:border-brand-border-strong ml-auto transition-colors">
            <MessageCircle className="h-3 w-3" /> {localKudos.comments.length > 0 && localKudos.comments.length}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-2 border-t border-brand-border pt-4">
            {localKudos.comments.map((c, i) => (
              <div key={c._id || i} className="flex gap-2">
                <Avatar name={c.authorName} size="sm" color="#475569" />
                <div className="flex-1 bg-brand-bg-soft rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-brand-text-secondary">{c.authorName}</p>
                  <p className="text-xs text-brand-text-secondary">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Avatar size="sm" color="#6366f1" />
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  placeholder="Add a comment…"
                  className="flex-1 h-8 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-xs text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                <button onClick={submitComment} disabled={sending || !comment.trim()}
                  className="h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center text-white disabled:opacity-40">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Give Kudos Modal ───────────────────────────────────────────────────────────

function GiveKudosModal({ values, onClose, onSuccess }: { values: Value[]; onClose: () => void; onSuccess: () => void }) {
  const [search, setSearch] = useState('');
  const [empResults, setEmpResults] = useState<{ _id: string; fullName: string; designation?: string }[]>([]);
  const [selected, setSelected] = useState<{ _id: string; fullName: string }[]>([]);
  const [valueId, setValueId] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleEmps = empResults.filter(e => !selected.some(s => s._id === e._id));

  const searchEmps = (q: string) => {
    setSearch(q);
    setShowDropdown(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      apiCallFunction<any>({
        url: `${API_BASE_URL}/recognition/employees?q=${encodeURIComponent(q)}`,
        showToast: false,
        thenFn: r => setEmpResults(r.data ?? []),
        catchFn: () => {},
      });
    }, 200);
  };

  useEffect(() => {
    searchEmps('');
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, []);

  const pick = (e: { _id: string; fullName: string }) => {
    if (!selected.some(s => s._id === e._id)) setSelected(p => [...p, e]);
    setSearch(''); setShowDropdown(false);
  };

  const submit = () => {
    if (!message.trim() || selected.length === 0) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/recognition/kudos`,
      method: 'POST',
      data: { recipientIds: selected.map(s => s._id), valueId: valueId || undefined, message, isPublic },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  const selectedValue = values.find(v => v._id === valueId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white border border-brand-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" /> Give Kudos
          </h3>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text-secondary"><X className="h-5 w-5" /></button>
        </div>

        {/* Recipients */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Who are you recognizing? *</label>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(e => (
                <span key={e._id} className="flex items-center gap-1.5 bg-brand-primary/20 border border-brand-primary/30 text-indigo-300 text-xs px-2.5 py-1 rounded-full">
                  {e.fullName}
                  <button onClick={() => setSelected(p => p.filter(s => s._id !== e._id))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <input value={search} onChange={e => searchEmps(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search name…"
              className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            {showDropdown && visibleEmps.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-brand-border rounded-xl shadow-2xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                {visibleEmps.map(e => (
                  <button key={e._id} onClick={() => pick(e)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg-soft transition-colors text-left">
                    <Avatar name={e.fullName} size="sm" />
                    <div>
                      <p className="text-sm text-brand-text">{e.fullName}</p>
                      {e.designation && <p className="text-xs text-brand-text-muted">{e.designation}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        {values.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Company Value (optional)</label>
            <div className="flex flex-wrap gap-2">
              {values.map(v => (
                <button key={v._id} onClick={() => setValueId(vid => vid === v._id ? '' : v._id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    valueId === v._id ? 'text-white border-transparent' : 'border-brand-border text-brand-text-secondary hover:border-brand-border-strong',
                  )}
                  style={valueId === v._id ? { backgroundColor: v.color } : {}}>
                  {v.icon && <span>{v.icon}</span>} {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Recognition Message *</label>
          {selectedValue && (
            <p className="text-[11px] text-brand-text-muted italic">Tip: How did they demonstrate &ldquo;{selectedValue.name}&rdquo;?</p>
          )}
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            rows={4} placeholder="Share what they did that was amazing…"
            className="w-full bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
        </div>

        {/* Visibility */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={cn('h-5 w-10 rounded-full transition-colors relative', isPublic ? 'bg-brand-primary' : 'bg-brand-bg-muted')}
            onClick={() => setIsPublic(v => !v)}>
            <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all shadow', isPublic ? 'left-5' : 'left-0.5')} />
          </div>
          <span className="text-sm text-brand-text-secondary">Visible to everyone</span>
        </label>

        <button onClick={submit} disabled={saving || !message.trim() || selected.length === 0}
          className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
          {saving ? 'Sending…' : 'Send Kudos 🌟'}
        </button>
      </div>
    </div>
  );
}

// ── SECTION: Recognition Feed ──────────────────────────────────────────────────

function RecognitionFeed({ values, userId }: { values: Value[]; userId?: string }) {
  const [kudosList, setKudosList] = useState<Kudos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGive, setShowGive] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/recognition/kudos?limit=30`,
      showToast: false,
      thenFn: r => setKudosList(r.data?.kudos ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const react = (id: string, type: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/recognition/kudos/${id}/react`, method: 'POST', data: { type }, showToast: false, thenFn: load });
  };

  const del = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/recognition/kudos/${id}`, method: 'DELETE', thenFn: load });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Recognition Feed</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">Celebrate your team&apos;s achievements</p>
        </div>
        <button onClick={() => setShowGive(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-primary/20">
          <Star className="h-4 w-4" /> Give Kudos
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : kudosList.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="text-5xl">🌟</div>
          <p className="text-brand-text-secondary font-medium">No kudos yet!</p>
          <p className="text-brand-text-muted text-sm">Be the first to recognize a colleague.</p>
          <button onClick={() => setShowGive(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors mt-2">
            <Plus className="h-4 w-4" /> Give First Kudos
          </button>
        </div>
      ) : (
        kudosList.map(k => <KudosCard key={k._id} kudos={k} currentUserId={userId} onReact={react} onDelete={del} />)
      )}

      {showGive && <GiveKudosModal values={values} onClose={() => setShowGive(false)} onSuccess={load} />}
    </div>
  );
}

// ── SECTION: Leaderboard ───────────────────────────────────────────────────────

function LeaderboardSection() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; kudosReceived: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      new Promise<void>(res => {
        apiCallFunction<any>({
          url: `${API_BASE_URL}/recognition/leaderboard?period=${period}&limit=25`,
          showToast: false,
          thenFn: r => { setEntries(r.data ?? []); res(); },
          catchFn: () => res(),
        });
      }),
      new Promise<void>(res => {
        apiCallFunction<any>({
          url: `${API_BASE_URL}/recognition/leaderboard/my-rank?period=${period}`,
          showToast: false,
          thenFn: r => { setMyRank(r.data ?? null); res(); },
          catchFn: () => res(),
        });
      }),
    ]).finally(() => setLoading(false));
  }, [period]);

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-text">Recognition Leaderboard</h2>
        <div className="flex bg-brand-bg-soft rounded-xl p-1 gap-1">
          {(['week', 'month', 'quarter', 'year', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors',
                period === p ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:text-brand-text-secondary')}>
              {p === 'all' ? 'All time' : p}
            </button>
          ))}
        </div>
      </div>

      {myRank && (
        <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-indigo-300 font-medium">Your Ranking</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-text-secondary">{myRank.kudosReceived} kudos received</span>
            <span className="text-xl font-black text-indigo-400">#{myRank.rank}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <TrendingUp className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-brand-text-muted text-sm">No recognition data for this period yet.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                const podiumRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const meta = RANK_META(podiumRank);
                return (
                  <div key={entry.employeeId}
                    className={cn(
                      'flex flex-col items-center rounded-2xl border p-4 text-center',
                      meta.bg,
                      podiumRank === 1 ? 'py-6 order-2' : 'order-1 order-3',
                    )}>
                    <span className="text-2xl mb-2">{meta.icon}</span>
                    <Avatar name={entry.employeeName} size="lg" color={meta.color} />
                    <p className="text-xs font-bold text-brand-text mt-2 truncate w-full text-center">{entry.employeeName.split(' ')[0]}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{entry.kudosReceived} kudos</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranked list */}
          <div className="space-y-2">
            {rest.map(entry => {
              const meta = RANK_META(entry.rank);
              return (
                <div key={entry.employeeId}
                  className="bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 flex items-center gap-4 hover:border-brand-border-strong transition-colors">
                  <span className="text-base font-black w-8 text-center" style={{ color: meta.color }}>
                    {typeof meta.icon === 'string' && meta.icon.startsWith('#') ? <span className="text-brand-text-muted text-sm">{meta.icon}</span> : meta.icon}
                  </span>
                  <Avatar name={entry.employeeName} color={meta.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text truncate">{entry.employeeName}</p>
                    {entry.designation && <p className="text-xs text-brand-text-muted truncate">{entry.designation}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">{entry.kudosReceived}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── SECTION: Award Programs ────────────────────────────────────────────────────

function ProgramsSection({ isHR }: { isHR: boolean }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Program | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showNominate, setShowNominate] = useState<Program | null>(null);
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [nomForm, setNomForm] = useState({ nomineeId: '', justification: '' });
  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState<{ _id: string; fullName: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/recognition/programs`,
      showToast: false,
      thenFn: r => setPrograms(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadNominations = (prog: Program) => {
    setSelected(prog);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/recognition/programs/${prog._id}/nominations`,
      showToast: false,
      thenFn: r => setNominations(r.data ?? []),
    });
  };

  const create = () => {
    if (!form.name) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/recognition/programs`,
      method: 'POST',
      data: { ...form, status: 'active' },
      thenFn: () => { load(); setShowCreate(false); setForm({ name: '', description: '', deadline: '' }); },
      finallyFn: () => setSaving(false),
    });
  };

  const searchEmps = (q: string) => {
    setEmpSearch(q);
    if (q.length < 2) { setEmpResults([]); return; }
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?search=${encodeURIComponent(q)}&limit=6`,
      showToast: false,
      thenFn: r => setEmpResults(r.data?.data?.employees ?? r.data?.data ?? []),
    });
  };

  const nominate = () => {
    if (!showNominate || !nomForm.nomineeId) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/recognition/programs/${showNominate._id}/nominate`,
      method: 'POST',
      data: nomForm,
      thenFn: () => {
        setShowNominate(null);
        setNomForm({ nomineeId: '', justification: '' });
        if (selected) loadNominations(selected);
      },
      finallyFn: () => setSaving(false),
    });
  };

  const selectWinner = (programId: string, nomineeId: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/recognition/programs/${programId}/winner`,
      method: 'POST',
      data: { nomineeId },
      thenFn: () => { if (selected) loadNominations(selected); },
    });
  };

  if (selected) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)}
            className="p-2 rounded-xl bg-brand-bg-soft text-brand-text-secondary hover:text-brand-text transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-brand-text">{selected.name}</h2>
            <p className="text-xs text-brand-text-muted">{selected.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setShowNominate(selected)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" /> Nominate
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {nominations.length === 0 ? (
            <div className="py-12 text-center">
              <Medal className="h-10 w-10 text-slate-700 mx-auto mb-2" />
              <p className="text-brand-text-muted text-sm">No nominations yet. Be the first to nominate!</p>
            </div>
          ) : nominations.map(n => (
            <div key={n._id} className={cn(
              'bg-brand-bg-soft border rounded-xl p-4',
              n.isWinner ? 'border-amber-500/30 bg-amber-500/5' : 'border-brand-border',
            )}>
              <div className="flex items-start gap-3">
                <Avatar name={n.nomineeName} color={n.isWinner ? '#f59e0b' : '#6366f1'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-brand-text">{n.nomineeName}</p>
                    {n.isWinner && <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">🏆 Winner</span>}
                  </div>
                  <p className="text-xs text-brand-text-muted mt-0.5">Nominated by {n.nominatorName}</p>
                  {n.justification && <p className="text-sm text-brand-text-secondary mt-2 italic">&ldquo;{n.justification}&rdquo;</p>}
                </div>
                {isHR && !n.isWinner && (
                  <button onClick={() => selectWinner(selected._id, n.nomineeId)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
                    <Crown className="h-3.5 w-3.5 inline mr-1" /> Select Winner
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nominate modal */}
        {showNominate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNominate(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-brand-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-brand-text">Nominate for {showNominate.name}</h3>
                <button onClick={() => setShowNominate(null)}><X className="h-5 w-5 text-brand-text-muted" /></button>
              </div>
              <div className="relative">
                <input value={empSearch} onChange={e => searchEmps(e.target.value)}
                  placeholder="Search employee…"
                  className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
                {empResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-brand-border rounded-xl shadow-2xl z-20">
                    {empResults.map(e => (
                      <button key={e._id} onClick={() => { setNomForm(f => ({ ...f, nomineeId: e._id })); setEmpSearch(e.fullName); setEmpResults([]); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg-soft transition-colors text-left">
                        <Avatar name={e.fullName} size="sm" />
                        <span className="text-sm text-brand-text">{e.fullName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {nomForm.nomineeId && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Nominee selected</p>}
              <textarea value={nomForm.justification} onChange={e => setNomForm(f => ({ ...f, justification: e.target.value }))}
                rows={3} placeholder="Why are you nominating them?"
                className="w-full bg-brand-bg-soft border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
              <button onClick={nominate} disabled={saving || !nomForm.nomineeId}
                className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                {saving ? 'Submitting…' : 'Submit Nomination'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-text">Award Programs</h2>
        {isHR && (
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Create Program
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-brand-bg-soft border border-brand-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-brand-text">New Award Program</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Program name *"
            className="w-full h-10 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} placeholder="Description (optional)"
            className="w-full bg-brand-bg-soft border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary resize-none" />
          <div>
            <label className="text-[11px] text-brand-text-muted block mb-1">Nomination Deadline</label>
            <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-brand-text-secondary">Cancel</button>
            <button onClick={create} disabled={saving || !form.name}
              className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <div className="py-16 text-center">
          <Medal className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-brand-text-muted text-sm">No award programs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map(p => (
            <button key={p._id} onClick={() => loadNominations(p)}
              className="bg-brand-bg-soft border border-brand-border rounded-2xl p-5 text-left hover:border-brand-border-strong transition-colors group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <StatusBadge status={AWARD_STATUS_MAP[p.status] ?? 'draft'} label={p.status} className="text-[11px] font-bold" />
              </div>
              <p className="text-sm font-bold text-brand-text group-hover:text-indigo-400 transition-colors">{p.name}</p>
              {p.description && <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-brand-text-muted">{p.nominationCount} nomination{p.nominationCount !== 1 ? 's' : ''}</span>
                {p.deadline && (
                  <span className="text-xs text-brand-text-muted">
                    Deadline: {new Date(p.deadline).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SECTION: Company Values ────────────────────────────────────────────────────

const VALUE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
const VALUE_ICONS  = ['⭐', '🌟', '💡', '🚀', '🤝', '🎯', '💪', '❤️', '🔥', '✨'];

function ValuesSection({ isHR }: { isHR: boolean }) {
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Value | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: VALUE_COLORS[0], icon: '⭐' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/recognition/values`,
      showToast: false,
      thenFn: r => setValues(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    if (!form.name) return;
    setSaving(true);
    const url    = editing ? `${API_BASE_URL}/recognition/values/${editing._id}` : `${API_BASE_URL}/recognition/values`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { load(); setShowForm(false); setEditing(null); setForm({ name: '', description: '', color: VALUE_COLORS[0], icon: '⭐' }); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/recognition/values/${id}`, method: 'DELETE', thenFn: load });
  };

  const startEdit = (v: Value) => {
    setEditing(v);
    setForm({ name: v.name, description: v.description || '', color: v.color, icon: v.icon || '⭐' });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Company Values</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">Values used to tag kudos and recognition</p>
        </div>
        {isHR && (
          <button onClick={() => { setEditing(null); setForm({ name: '', description: '', color: VALUE_COLORS[0], icon: '⭐' }); setShowForm(v => !v); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Add Value
          </button>
        )}
      </div>

      {showForm && isHR && (
        <div className="bg-brand-bg-soft border border-brand-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-brand-text">{editing ? 'Edit Value' : 'New Company Value'}</h3>
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div>
              <label className="text-[11px] text-brand-text-muted block mb-1">Icon</label>
              <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-lg text-center text-lg focus:outline-none focus:border-brand-primary">
                {VALUE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-brand-text-muted block mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Value name"
                className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          <div>
            <label className="text-[11px] text-brand-text-muted block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {VALUE_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={cn('h-8 w-8 rounded-full border-2 transition-all', form.color === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-brand-text-secondary">Cancel</button>
            <button onClick={save} disabled={saving || !form.name}
              className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      ) : values.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-brand-text-muted text-sm">No company values configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {values.map(v => (
            <div key={v._id} className="bg-brand-bg-soft border border-brand-border rounded-2xl p-5 hover:border-brand-border-strong transition-colors"
              style={{ borderLeftColor: v.color, borderLeftWidth: 4 }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: v.color + '22' }}>
                  {v.icon || '⭐'}
                </div>
                {isHR && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-bg-soft transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => del(v._id)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-brand-text">{v.name}</p>
              {v.description && <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">{v.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SECTION: Certifications (formal awards - preserved from existing page) ─────

function CertificationsSection() {
  const { isHR } = useAuth();
  const [types, setTypes]             = useState<AwardType[]>([]);
  const [awards, setAwards]           = useState<EmpAward[]>([]);
  const [awardTotal, setTotal]        = useState(0);
  const [awardPage, setPage]          = useState(1);
  const [filterType, setFType]        = useState('');
  const [filterYear, setFYear]        = useState('');
  const [searchQ, setSearchQ]         = useState('');
  const [showBulk, setShowBulk]       = useState(false);
  const [showMT, setShowMT]           = useState(false);
  const limit = 20;

  const fetchTypes = useCallback(() => {
    apiCallFunction<any>({ url: `${API_BASE_URL}/awards/types`, showToast: false, thenFn: r => setTypes(r.data ?? []), catchFn: () => {} });
  }, []);

  const fetchAwards = useCallback((pg = awardPage) => {
    const params = new URLSearchParams({ page: String(pg), limit: String(limit) });
    if (filterType) params.set('awardTypeId', filterType);
    if (filterYear) params.set('year', filterYear);
    if (searchQ) params.set('search', searchQ);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/awards?${params}`, showToast: false,
      thenFn: r => { setAwards(r.data?.data ?? []); setTotal(r.data?.total ?? 0); },
      catchFn: () => {},
    });
  }, [awardPage, filterType, filterYear, searchQ]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);
  useEffect(() => { fetchAwards(awardPage); }, [awardPage, filterType, filterYear]);

  const revoke = (id: string) => apiCallFunction({ url: `${API_BASE_URL}/awards/${id}`, method: 'DELETE', thenFn: () => fetchAwards(awardPage) });
  const totalPages = Math.ceil(awardTotal / limit);
  const yearOpts = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-text">Awards & Certifications</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">Formal award records and grant history</p>
        </div>
        <div className="flex items-center gap-2">
          {isHR && (
            <button onClick={() => setShowMT(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-bg-muted hover:bg-brand-border-strong text-brand-text text-sm font-semibold transition-colors">
              <Settings2 className="h-4 w-4" /> Manage Types
            </button>
          )}
          {isHR && (
            <button onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors">
              <Users className="h-4 w-4" /> Bulk Award
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
            onKeyDown={e => e.key === 'Enter' && fetchAwards(1)}
            placeholder="Search employee…"
            className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
        </div>
        <select value={filterType} onChange={e => { setFType(e.target.value); setPage(1); }}
          className="h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary">
          <option value="">All types</option>
          {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={filterYear} onChange={e => { setFYear(e.target.value); setPage(1); }}
          className="h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text-secondary focus:outline-none focus:border-brand-primary">
          <option value="">All years</option>
          {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Records table */}
      <div className="bg-brand-bg-soft border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg-soft/50 border-b border-brand-border">
              <tr>
                {['Employee', 'Award', 'Year', 'Dept.', 'Awarded By', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {awards.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-brand-text-muted">No award records found.</td></tr>
              ) : awards.map(a => (
                <tr key={a._id} className="hover:bg-brand-bg-soft/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-text">{a.employeeName}</p>
                    {a.staffNumber && <p className="text-xs text-brand-text-muted">{a.staffNumber}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
                      <Trophy className="h-3 w-3" /> {a.awardTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary font-medium">{a.year}</td>
                  <td className="px-4 py-3 text-brand-text-muted text-xs">{a.department || '—'}</td>
                  <td className="px-4 py-3 text-brand-text-muted text-xs">{a.awardedBy}</td>
                  <td className="px-4 py-3 text-brand-text-muted text-xs">{new Date(a.awardedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</td>
                  <td className="px-4 py-3">
                    {isHR && (
                      <button onClick={() => revoke(a._id)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={awardPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brand-border text-sm text-brand-text-secondary disabled:opacity-40 hover:bg-brand-bg-soft transition-colors">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-brand-text-muted">Page {awardPage} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={awardPage >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-brand-border text-sm text-brand-text-secondary disabled:opacity-40 hover:bg-brand-bg-soft transition-colors">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showBulk && <BulkAwardModal types={types} onClose={() => setShowBulk(false)} onSuccess={() => fetchAwards(1)} />}
      {showMT && <AwardTypesModal onClose={() => setShowMT(false)} onChanged={fetchTypes} />}
    </div>
  );
}

// ── Award Types Modal ──────────────────────────────────────────────────────────

const CATEGORIES = ['general', 'performance', 'attendance', 'leadership', 'innovation', 'service'];
const INTERVALS  = ['none', 'monthly', 'quarterly', 'annually'];

function AwardTypesModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [types, setTypes]   = useState<AwardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AwardType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const blank = { name: '', description: '', category: 'general', repeatInterval: 'none', nextDueDate: '' };
  const [form, setForm]       = useState(blank);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/awards/types`, showToast: false,
      thenFn: r => setTypes(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(blank); setShowForm(true); };
  const openEdit   = (t: AwardType) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description || '', category: t.category || 'general', repeatInterval: t.repeatInterval || 'none', nextDueDate: t.nextDueDate ? t.nextDueDate.slice(0, 10) : '' });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const url    = editing ? `${API_BASE_URL}/awards/types/${editing._id}` : `${API_BASE_URL}/awards/types`;
    const method = editing ? 'PUT' : 'POST';
    apiCallFunction({
      url, method, data: form,
      thenFn: () => { load(); onChanged(); setShowForm(false); },
      finallyFn: () => setSaving(false),
    });
  };

  const del = (id: string) => {
    apiCallFunction({ url: `${API_BASE_URL}/awards/types/${id}`, method: 'DELETE', thenFn: () => { load(); onChanged(); } });
  };

  const inputCls = 'w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-brand-bg-soft rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-brand-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div>
            <h2 className="text-base font-bold text-brand-text">Award Types</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">Define the award categories you give to employees</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-semibold transition-colors">
              <Plus className="h-3.5 w-3.5" /> New Type
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="p-5 border-b border-brand-border bg-brand-bg-soft/40 space-y-3">
            <h3 className="text-sm font-semibold text-brand-text">{editing ? 'Edit Type' : 'New Award Type'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Award name *" className={inputCls} />
              </div>
              <div className="col-span-2">
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)" className={inputCls} />
              </div>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <select value={form.repeatInterval} onChange={e => setForm(f => ({ ...f, repeatInterval: e.target.value }))} className={inputCls}>
                {INTERVALS.map(i => <option key={i} value={i}>{i === 'none' ? 'One-time' : i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
              </select>
              {form.repeatInterval !== 'none' && (
                <div className="col-span-2">
                  <label className="text-xs text-brand-text-muted mb-1 block">Next Due Date</label>
                  <input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} className={inputCls} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-xl border border-brand-border-strong text-sm text-brand-text-secondary hover:bg-brand-bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {editing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
          ) : types.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-brand-text-muted">No award types yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {types.map(t => (
                <div key={t._id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-brand-border/60 hover:border-brand-border-strong transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-brand-text text-sm">{t.name}</span>
                      <span className="text-xs text-brand-text-muted bg-brand-bg-soft px-2 py-0.5 rounded-full capitalize">{t.category || 'general'}</span>
                      {t.repeatInterval && t.repeatInterval !== 'none' && (
                        <span className="text-xs text-indigo-400 bg-brand-primary/10 px-2 py-0.5 rounded-full capitalize">{t.repeatInterval}</span>
                      )}
                    </div>
                    {t.description && <p className="text-xs text-brand-text-muted mt-1 ml-6 truncate">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-indigo-400 hover:bg-brand-primary-hover/10 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => del(t._id)} className="p-1.5 rounded-lg text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulk Award Modal ───────────────────────────────────────────────────────────

function BulkAwardModal({ types, onClose, onSuccess }: { types: AwardType[]; onClose: () => void; onSuccess: () => void }) {
  const [q, setQ]                   = useState('');
  const [dept]                      = useState('');
  const [page, setPage]             = useState(1);
  const [employees, setEmployees]   = useState<{ _id: string; fullName: string; staffNumber?: string; department?: string }[]>([]);
  const [total, setTotal]           = useState(0);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [awardTypeId, setAwardType] = useState('');
  const [notes, setNotes]           = useState('');
  const [year, setYear]             = useState(new Date().getFullYear());
  const [granting, setGranting]     = useState(false);
  const limit = 20;
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEmployees = useCallback((pg = 1, query = q, department = dept) => {
    setLoadingEmp(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/awards/employees/search?q=${encodeURIComponent(query)}&department=${encodeURIComponent(department)}&page=${pg}&limit=${limit}`,
      showToast: false,
      thenFn: r => { setEmployees(r.data?.data ?? []); setTotal(r.data?.total ?? 0); },
      finallyFn: () => setLoadingEmp(false),
    });
  }, [q, dept]);

  useEffect(() => { fetchEmployees(); }, []);

  const handleSearch = (val: string) => {
    setQ(val); setPage(1);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchEmployees(1, val, dept), 350);
  };

  const toggle = (id: string) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const grant = () => {
    if (!awardTypeId || selected.size === 0) return;
    setGranting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/awards/bulk`, method: 'POST',
      data: { employeeIds: [...selected], awardTypeId, notes, year },
      thenFn: () => { onSuccess(); onClose(); },
      finallyFn: () => setGranting(false),
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-brand-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-base text-brand-text">Bulk Award Grant</h2>
            {selected.size > 0 && <span className="bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{selected.size}</span>}
          </div>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text-secondary"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 border-r border-brand-border">
            <div className="px-4 py-3 border-b border-brand-border space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-muted" />
                <input value={q} onChange={e => handleSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="w-full h-9 pl-9 pr-3 bg-brand-bg-soft border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => setSelected(new Set(employees.map(e => e._id)))} className="text-indigo-400 hover:underline">Select page</button>
                <span className="text-brand-text-muted">·</span>
                <button onClick={() => setSelected(new Set())} className="text-brand-text-muted hover:text-brand-text-secondary">Clear</button>
                <span className="ml-auto text-brand-text-muted">{total} employees</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-brand-border/50">
              {loadingEmp
                ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-brand-primary" /></div>
                : employees.length === 0
                  ? <p className="text-xs text-brand-text-muted text-center py-8">No employees found.</p>
                  : employees.map(e => {
                      const isSel = selected.has(e._id);
                      return (
                        <button key={e._id} onClick={() => toggle(e._id)}
                          className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-bg-soft transition-colors', isSel && 'bg-brand-primary/5')}>
                          <div className={cn('h-4 w-4 rounded border-2 flex items-center justify-center shrink-0', isSel ? 'bg-brand-primary border-brand-primary' : 'border-brand-border-strong')}>
                            {isSel && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-text truncate">{e.fullName}</p>
                            <p className="text-xs text-brand-text-muted">{[e.staffNumber, e.department].filter(Boolean).join(' · ')}</p>
                          </div>
                        </button>
                      );
                    })
              }
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-brand-border shrink-0">
                <button onClick={() => { const p = page - 1; setPage(p); fetchEmployees(p); }} disabled={page === 1}
                  className="p-1 rounded disabled:opacity-30 text-brand-text-secondary hover:text-brand-text"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs text-brand-text-muted">Page {page}/{totalPages}</span>
                <button onClick={() => { const p = page + 1; setPage(p); fetchEmployees(p); }} disabled={page >= totalPages}
                  className="p-1 rounded disabled:opacity-30 text-brand-text-secondary hover:text-brand-text"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>

          <div className="w-full md:w-72 p-5 space-y-4 shrink-0 overflow-y-auto">
            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Award Details</p>
            <div className="space-y-1">
              <label className="text-xs text-brand-text-muted">Award Type *</label>
              <select value={awardTypeId} onChange={e => setAwardType(e.target.value)}
                className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary">
                <option value="">— Select —</option>
                {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-brand-text-muted">Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
                className="w-full h-9 bg-brand-bg-soft border border-brand-border rounded-xl px-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-brand-text-muted">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full bg-brand-bg-soft border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text resize-none focus:outline-none focus:border-brand-primary placeholder:text-brand-text-muted"
                placeholder="e.g. Q3 top performers" />
            </div>
            <button onClick={grant} disabled={granting || !awardTypeId || selected.size === 0}
              className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm disabled:opacity-50 transition-colors">
              {granting ? 'Granting…' : `Grant to ${selected.size || 0} Employee${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TAB NAV ────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'feed',           label: 'Recognition Feed', icon: Heart    },
  { key: 'leaderboard',   label: 'Leaderboard',      icon: TrendingUp },
  { key: 'programs',      label: 'Programs',          icon: Medal    },
  { key: 'values',        label: 'Values',            icon: Star     },
  { key: 'certifications',label: 'Certifications',   icon: Award    },
];

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function AwardsPage({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('feed');
  const [values, setValues] = useState<Value[]>([]);
  const { userData, isHR } = useAuth();

  const userId = userData?.employeeId ?? undefined;

  useEffect(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/recognition/values`,
      showToast: false,
      thenFn: r => setValues(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const tabBar = (
    <div className={cn('flex gap-1 overflow-x-auto', embedded ? 'border-b border-brand-border' : 'px-6 border-b border-brand-border')}>
      {TABS.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setTab(key)}
          className={cn(
            'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors shrink-0',
            tab === key
              ? 'border-brand-primary text-indigo-400'
              : 'border-transparent text-brand-text-muted hover:text-brand-text-secondary',
          )}>
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );

  const tabContent = (
    <div className={embedded ? 'py-4' : 'px-6 py-6'}>
      {tab === 'feed'          && <RecognitionFeed values={values} userId={userId} />}
      {tab === 'leaderboard'   && <LeaderboardSection />}
      {tab === 'programs'      && <ProgramsSection isHR={isHR} />}
      {tab === 'values'        && <ValuesSection isHR={isHR} />}
      {tab === 'certifications'&& <CertificationsSection />}
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        {tabBar}
        {tabContent}
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-6 bg-white min-h-screen">
      <div className="px-6 py-6 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-text">Awards & Recognition</h1>
            <p className="text-xs text-brand-text-muted">Celebrate, reward, and recognize your team</p>
          </div>
        </div>
      </div>
      {tabBar}
      {tabContent}
    </div>
  );
}
