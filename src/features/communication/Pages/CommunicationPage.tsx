'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Users, Gift, Video, Shield, Megaphone,
  Plus, MessageCircle, PartyPopper,
  Send, X, Check, Lock,
  Repeat2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Post {
  _id: string;
  authorId: string;
  author?: { fullName: string; designation?: string };
  type: string;
  content: string;
  imageUrls?: string[];
  isPinned?: boolean;
  reactions: { type: string; employeeId: string }[];
  commentCount: number;
  createdAt: string;
  celebrationType?: string;
  celebrationEmployeeName?: string;
}

interface Community {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  type: string;
  memberCount: number;
  isMember: boolean;
}

interface Celebration {
  type: 'birthday' | 'anniversary' | 'new_joiner';
  employee: { _id: string; fullName: string; designation?: string };
  date: string;
  daysUntil: number;
  years?: number;
}

interface MeetingSeries {
  _id: string;
  frequency: string;
  time?: string;
  otherParticipant?: { fullName: string; designation?: string };
  lastMeeting?: { date: string; status: string } | null;
}

type NavSection = 'feed' | 'communities' | 'celebrations' | 'meetings' | 'trust' | 'announcements';

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

const CELEBRATION_META = {
  birthday:   { emoji: '🎂', label: 'Birthday',       color: '#ec4899', bg: 'from-pink-600/20 to-purple-600/20',    btn: 'Send wishes'     },
  anniversary: { emoji: '🎉', label: 'Work Anniversary', color: '#f59e0b', bg: 'from-amber-600/20 to-orange-600/20', btn: 'Congratulate'   },
  new_joiner:  { emoji: '👋', label: 'New Joiner',    color: '#10b981', bg: 'from-emerald-600/20 to-teal-600/20',  btn: 'Say hello'       },
};

const REACTION_EMOJIS = [
  { type: 'clap',      emoji: '👏' },
  { type: 'heart',     emoji: '❤️' },
  { type: 'celebrate', emoji: '🎉' },
  { type: 'laugh',     emoji: '😂' },
];

const FREQ_LABELS: Record<string, string> = {
  once: 'One-time', weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly',
};

const TRUST_CATEGORIES = [
  'Harassment or discrimination',
  'Safety concern',
  'Financial misconduct',
  'Policy violation',
  'Conflict of interest',
  'Other',
];

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md', color }: { name?: string; size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs';
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white shrink-0', sz)}
      style={{ backgroundColor: color || '#6366f1' }}>
      {initials(name)}
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────────

function PostCard({ post, onReact, currentUserId }: { post: Post; onReact: (id: string, type: string) => void; currentUserId?: string }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ _id: string; content: string; author?: { fullName: string }; createdAt: string }[]>([]);
  const [sending, setSending] = useState(false);

  const loadComments = () => {
    if (!showComments && post.commentCount > 0) {
      apiCallFunction<any>({
        url: `${API_BASE_URL}/communication/posts/${post._id}/comments`,
        showToast: false,
        thenFn: r => setComments(r.data ?? []),
      });
    }
    setShowComments(v => !v);
  };

  const submitComment = () => {
    if (!comment.trim()) return;
    setSending(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/posts/${post._id}/comments`,
      method: 'POST',
      data: { content: comment },
      thenFn: r => {
        setComments(prev => [...prev, r.data]);
        setComment('');
      },
      finallyFn: () => setSending(false),
    });
  };

  const reactionCounts = REACTION_EMOJIS.map(({ type, emoji }) => ({
    type, emoji,
    count: post.reactions.filter(r => r.type === type).length,
    mine: post.reactions.some(r => r.type === type && r.employeeId === currentUserId),
  }));

  const isPinned = post.isPinned;

  return (
    <div className={cn(
      'bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden',
      isPinned && 'border-l-4 border-l-amber-500',
    )}>
      {isPinned && (
        <div className="flex items-center gap-1.5 px-5 pt-3 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
          <Megaphone className="h-3 w-3" /> Announcement
        </div>
      )}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={post.author?.fullName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-100">{post.author?.fullName ?? 'Someone'}</p>
            <p className="text-[11px] text-slate-500">{post.author?.designation ?? ''} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-4 flex-wrap">
          {reactionCounts.map(({ type, emoji, count, mine }) => (
            <button key={type} onClick={() => onReact(post._id, type)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                mine
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600',
              )}>
              {emoji} {count > 0 && <span>{count}</span>}
            </button>
          ))}
          <button onClick={loadComments}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 ml-auto transition-colors">
            <MessageCircle className="h-3 w-3" /> {post.commentCount > 0 ? post.commentCount : ''} Comments
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
            {comments.map(c => (
              <div key={c._id} className="flex gap-2">
                <Avatar name={c.author?.fullName} size="sm" color="#475569" />
                <div className="flex-1 bg-slate-800 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-slate-300">{c.author?.fullName}</p>
                  <p className="text-xs text-slate-400">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Avatar name="" size="sm" color="#6366f1" />
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  placeholder="Write a comment…"
                  className="flex-1 h-8 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                <button onClick={submitComment} disabled={sending || !comment.trim()}
                  className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white disabled:opacity-40">
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

// ── Post Composer ──────────────────────────────────────────────────────────────

function PostComposer({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('update');
  const [posting, setPosting] = useState(false);

  const submit = () => {
    if (!content.trim()) return;
    setPosting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/communication/posts`,
      method: 'POST',
      data: { content, type },
      thenFn: () => { setContent(''); setType('update'); setOpen(false); onPosted(); },
      finallyFn: () => setPosting(false),
    });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl px-5 py-4 text-left text-sm text-slate-600 hover:border-slate-600 hover:text-slate-500 transition-colors flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Plus className="h-4 w-4 text-indigo-400" />
        </div>
        Share something with your team…
      </button>
    );
  }

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="flex gap-2">
        {[
          { v: 'update', l: 'Update', e: '💬' },
          { v: 'announcement', l: 'Announcement', e: '📢' },
          { v: 'event', l: 'Event', e: '📅' },
        ].map(({ v, l, e }) => (
          <button key={v} onClick={() => setType(v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              type === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600',
            )}>
            {e} {l}
          </button>
        ))}
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)}
        rows={4} placeholder="What's on your mind?"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
      <div className="flex justify-end gap-2">
        <button onClick={() => { setOpen(false); setContent(''); }}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Cancel
        </button>
        <button onClick={submit} disabled={posting || !content.trim()}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}

// ── SECTIONS ───────────────────────────────────────────────────────────────────

function FeedSection({ userId }: { userId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/feed`,
      showToast: false,
      thenFn: r => setPosts(r.data?.posts ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const react = (id: string, type: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/communication/posts/${id}/react`,
      method: 'POST',
      data: { type },
      showToast: false,
      thenFn: () => load(),
    });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <PostComposer onPosted={load} />
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <Newspaper className="h-10 w-10 text-slate-700 mx-auto" />
          <p className="text-slate-600 text-sm">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map(p => <PostCard key={p._id} post={p} onReact={react} currentUserId={userId} />)
      )}
    </div>
  );
}

function CommunitiesSection() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('👥');
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/communities`,
      showToast: false,
      thenFn: r => setCommunities(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = (id: string, isMember: boolean) => {
    apiCallFunction({
      url: `${API_BASE_URL}/communication/communities/${id}/${isMember ? 'leave' : 'join'}`,
      method: 'POST',
      data: {},
      thenFn: load,
    });
  };

  const create = () => {
    if (!newName.trim()) return;
    setCreating(true);
    apiCallFunction({
      url: `${API_BASE_URL}/communication/communities`,
      method: 'POST',
      data: { name: newName, description: newDesc, icon: newIcon, type: 'interest' },
      thenFn: () => { load(); setShowCreate(false); setNewName(''); setNewDesc(''); },
      finallyFn: () => setCreating(false),
    });
  };

  const TYPE_COLORS: Record<string, string> = {
    company: 'text-blue-400', team: 'text-emerald-400', interest: 'text-purple-400', private: 'text-slate-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Communities</h2>
        <button onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">New Community</h3>
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <input value={newIcon} onChange={e => setNewIcon(e.target.value)}
              className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-center text-xl focus:outline-none focus:border-indigo-500" />
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Community name *"
              className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button onClick={create} disabled={creating || !newName.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : 'Create Community'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map(c => (
            <div key={c._id} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                  {c.icon || '👥'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-100 truncate">{c.name}</p>
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wide capitalize', TYPE_COLORS[c.type] || 'text-slate-500')}>
                    {c.type}
                  </p>
                </div>
              </div>
              {c.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">{c.memberCount} members</span>
                <button onClick={() => join(c._id, c.isMember)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    c.isMember
                      ? 'bg-slate-700 text-slate-400 hover:bg-red-500/10 hover:text-red-400'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white',
                  )}>
                  {c.isMember ? 'Leave' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CelebrationSection() {
  const [items, setItems] = useState<Celebration[]>([]);
  const [loading, setLoading] = useState(true);
  const [clapping, setClapping] = useState<Celebration | null>(null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/celebrations`,
      showToast: false,
      thenFn: r => setItems(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  const sendClap = () => {
    if (!clapping || !msg.trim()) return;
    setSending(true);
    apiCallFunction({
      url: `${API_BASE_URL}/communication/celebrations/clap`,
      method: 'POST',
      data: { recipientId: clapping.employee._id, message: msg, visibility: 'public' },
      thenFn: () => { setClapping(null); setMsg(''); },
      finallyFn: () => setSending(false),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Celebrations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Upcoming milestones in the next 30 days</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <PartyPopper className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">No upcoming celebrations in the next 30 days.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const meta = CELEBRATION_META[item.type];
            return (
              <div key={i} className={cn('bg-gradient-to-br rounded-2xl p-5 border border-slate-700/50', meta.bg)}>
                <div className="text-4xl mb-3">{meta.emoji}</div>
                <p className="text-sm font-bold text-slate-100">
                  {item.type === 'anniversary'
                    ? `${item.employee.fullName}'s ${item.years}-Year Anniversary`
                    : item.type === 'birthday'
                    ? `${item.employee.fullName}'s Birthday`
                    : `Welcome, ${item.employee.fullName}!`}
                </p>
                <p className="text-xs mt-1" style={{ color: meta.color }}>
                  {item.daysUntil === 0 ? 'Today! 🎊' : `In ${item.daysUntil} day${item.daysUntil !== 1 ? 's' : ''}`}
                  {' · '}{new Date(item.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                </p>
                <button onClick={() => { setClapping(item); setMsg(''); }}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                  style={{ backgroundColor: meta.color }}>
                  👏 {meta.btn}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Clap modal */}
      {clapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setClapping(null)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Send a Clap 👏</h3>
              <button onClick={() => setClapping(null)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center py-2">
              <div className="text-5xl mb-2">{CELEBRATION_META[clapping.type].emoji}</div>
              <p className="text-sm font-bold text-slate-200">{clapping.employee.fullName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                `Happy ${clapping.type === 'birthday' ? 'Birthday' : clapping.type === 'anniversary' ? `${clapping.years} Year Anniversary` : 'joining the team'}! ${CELEBRATION_META[clapping.type].emoji}`,
                'Congratulations! 🎊',
                'Wishing you all the best! ✨',
              ].map(t => (
                <button key={t} onClick={() => setMsg(t)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                  {t}
                </button>
              ))}
            </div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              rows={3} placeholder="Write a personal message…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
            <button onClick={sendClap} disabled={sending || !msg.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {sending ? 'Sending…' : 'Send Clap 👏'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingsSection() {
  const [series, setSeries] = useState<MeetingSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<{ _id: string; fullName: string; designation?: string }[]>([]);
  const [form, setForm] = useState({ frequency: 'weekly', time: '10:00', duration: 30 });
  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState<{ _id: string; fullName: string; designation?: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/meetings`,
      showToast: false,
      thenFn: r => setSeries(r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchEmps = (q: string) => {
    setEmpSearch(q);
    if (q.length < 2) { setEmpResults([]); return; }
    apiCallFunction<any>({
      url: `${API_BASE_URL}/employees?search=${encodeURIComponent(q)}&limit=8`,
      showToast: false,
      thenFn: r => setEmpResults(r.data?.data ?? []),
    });
  };

  const addPerson = (emp: { _id: string; fullName: string; designation?: string }) => {
    if (!selectedPeople.find(p => p._id === emp._id)) {
      setSelectedPeople(prev => [...prev, emp]);
    }
    setEmpSearch('');
    setEmpResults([]);
  };

  const removePerson = (id: string) => setSelectedPeople(prev => prev.filter(p => p._id !== id));

  const schedule = () => {
    if (selectedPeople.length === 0) return;
    setSaving(true);
    Promise.all(
      selectedPeople.map(person =>
        apiCallFunction({
          url: `${API_BASE_URL}/communication/meetings`,
          method: 'POST',
          data: { withEmployeeId: person._id, ...form },
          showToast: false,
        })
      )
    ).finally(() => {
      setSaving(false);
      load();
      setShowSchedule(false);
      setSelectedPeople([]);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">1:1 Meetings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Your recurring 1:1 meeting series</p>
        </div>
        <button onClick={() => { setShowSchedule(v => !v); setSelectedPeople([]); setEmpSearch(''); setEmpResults([]); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> Schedule 1:1
        </button>
      </div>

      {showSchedule && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Schedule a 1:1</h3>

          {/* Selected people chips */}
          {selectedPeople.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPeople.map(p => (
                <span key={p._id} className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {p.fullName}
                  <button type="button" onClick={() => removePerson(p._id)} className="hover:text-white transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <input
              value={empSearch}
              onChange={e => searchEmps(e.target.value)}
              placeholder={selectedPeople.length > 0 ? 'Add another person…' : 'Search for a person…'}
              className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            {empResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                {empResults
                  .filter(e => !selectedPeople.find(p => p._id === e._id))
                  .map(e => (
                    <button key={e._id} type="button" onClick={() => addPerson(e)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left">
                      <Avatar name={e.fullName} size="sm" />
                      <div>
                        <p className="text-sm text-slate-200">{e.fullName}</p>
                        {e.designation && <p className="text-xs text-slate-500">{e.designation}</p>}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="once">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Duration</label>
              <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {selectedPeople.length > 1
                ? `Will create ${selectedPeople.length} separate 1:1 series`
                : 'Select at least one person'}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowSchedule(false); setSelectedPeople([]); }} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button type="button" onClick={schedule} disabled={saving || selectedPeople.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                {saving ? 'Scheduling…' : selectedPeople.length > 1 ? `Schedule ${selectedPeople.length} 1:1s` : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : series.length === 0 ? (
        <div className="py-16 text-center">
          <Video className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">No 1:1 meetings yet. Schedule your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map(s => (
            <div key={s._id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-slate-600 transition-colors">
              <Avatar name={s.otherParticipant?.fullName} size="lg" color="#6366f1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-100">{s.otherParticipant?.fullName ?? 'Participant'}</p>
                <p className="text-xs text-slate-500">{s.otherParticipant?.designation}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Repeat2 className="h-3 w-3" /> {FREQ_LABELS[s.frequency] || s.frequency}
                  </span>
                  {s.time && <span className="flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> {s.time}</span>}
                </div>
              </div>
              {s.lastMeeting && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-600">Last meeting</p>
                  <p className="text-xs text-slate-400">{new Date(s.lastMeeting.date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrustChannelSection() {
  const { isHR } = useAuth();
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkCode, setCheckCode] = useState('');
  const [checkResult, setCheckResult] = useState<{ status: string; category: string; updatedAt: string; responseToReporter?: string | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<'submit' | 'check' | 'admin'>('submit');

  // Admin state
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const loadReports = useCallback(() => {
    setLoadingReports(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/trust/admin`,
      showToast: false,
      thenFn: r => setReports(r.data ?? []),
      finallyFn: () => setLoadingReports(false),
    });
  }, []);

  useEffect(() => {
    if (tab === 'admin' && isHR) loadReports();
  }, [tab, isHR, loadReports]);

  const updateStatus = (id: string, status: string, adminNotes: string, responseToReporter: string) => {
    apiCallFunction({
      url: `${API_BASE_URL}/communication/trust/admin/${id}`,
      method: 'PUT',
      data: { status, adminNotes, responseToReporter },
      thenFn: loadReports,
    });
  };

  const submit = () => {
    if (!category || desc.length < 20) return;
    setSubmitting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/communication/trust`,
      method: 'POST',
      data: { category, description: desc },
      showToast: false,
      thenFn: (r: any) => { setCode(r.data?.trackingCode ?? ''); setSubmitted(true); },
      finallyFn: () => setSubmitting(false),
    });
  };

  const check = () => {
    if (!checkCode.trim()) return;
    setChecking(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/communication/trust/${encodeURIComponent(checkCode.trim())}`,
      showToast: false,
      thenFn: r => setCheckResult(r.data ?? null),
      catchFn: () => setCheckResult(null),
      finallyFn: () => setChecking(false),
    });
  };

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400',
    under_review: 'bg-amber-500/10 text-amber-400',
    resolved: 'bg-emerald-500/10 text-emerald-400',
    closed: 'bg-slate-700 text-slate-400',
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto">
          <Shield className="h-7 w-7 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Trust Channel</h2>
        <p className="text-sm text-slate-500">Speak up safely. Reports are completely anonymous.</p>
      </div>

      <div className="flex bg-slate-800 rounded-xl p-1">
        {([
          { key: 'submit', label: 'Submit Report' },
          { key: 'check',  label: 'Check Status'  },
          ...(isHR ? [{ key: 'admin', label: 'Admin View' }] : []),
        ] as { key: 'submit' | 'check' | 'admin'; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors',
              tab === key ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'submit' && !submitted && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Category *</label>
            {TRUST_CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2.5 cursor-pointer">
                <div className={cn('h-4 w-4 rounded-full border-2 transition-colors shrink-0',
                  category === cat ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600')}>
                  {category === cat && <div className="h-full w-full rounded-full bg-white scale-50" />}
                </div>
                <input type="radio" className="sr-only" checked={category === cat} onChange={() => setCategory(cat)} />
                <span className="text-sm text-slate-300">{cat}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Description *</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              rows={5} placeholder="Be as specific as possible. Do not include your own name. (min 20 characters)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
            <p className="text-right text-[10px] text-slate-600 mt-1">{desc.length}/500</p>
          </div>
          <button onClick={submit} disabled={submitting || !category || desc.length < 20}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit Anonymously'}
          </button>
        </div>
      )}

      {tab === 'submit' && submitted && (
        <div className="bg-[#1e293b] border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-100">Report Submitted</p>
            <p className="text-sm text-slate-500 mt-1">Your report has been submitted anonymously.</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Your tracking code</p>
            <p className="text-2xl font-black text-indigo-400 tracking-widest">{code}</p>
            <p className="text-xs text-slate-600 mt-1">Save this code to check for updates.</p>
          </div>
          <button onClick={() => { setSubmitted(false); setCategory(''); setDesc(''); setCode(''); }}
            className="text-sm text-indigo-400 hover:text-indigo-300">Submit another report</button>
        </div>
      )}

      {tab === 'check' && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 space-y-4">
          <p className="text-sm text-slate-400">Enter your 8-character tracking code to check the status of your report.</p>
          <div className="flex gap-2">
            <input value={checkCode} onChange={e => setCheckCode(e.target.value)}
              placeholder="XXXX-XXXX"
              className="flex-1 h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 tracking-widest uppercase" />
            <button onClick={check} disabled={checking || !checkCode.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {checking ? '…' : 'Check'}
            </button>
          </div>
          {checkResult && (
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 capitalize">{checkResult.category}</p>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', STATUS_COLORS[checkResult.status] || STATUS_COLORS.new)}>
                  {checkResult.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600">Last updated: {new Date(checkResult.updatedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
              {checkResult.responseToReporter ? (
                <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mb-1">Response from HR</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{checkResult.responseToReporter}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">No response yet. Check back later.</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'admin' && isHR && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''} total</p>
            <button onClick={loadReports} className="text-xs text-indigo-400 hover:text-indigo-300">Refresh</button>
          </div>
          {loadingReports ? (
            <div className="py-12 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-600 text-sm">No trust reports yet.</p>
            </div>
          ) : reports.map(r => (
            <div key={r._id} className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                onClick={() => setExpandedReport(expandedReport === r._id ? null : r._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200 capitalize">{r.category}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[r.status] || STATUS_COLORS.new)}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Code: <span className="font-mono text-slate-400">{r.trackingCode}</span>
                    {' · '}{new Date(r.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className="text-slate-600 text-xs">{expandedReport === r._id ? '▲' : '▼'}</span>
              </div>
              {expandedReport === r._id && (
                <div className="border-t border-slate-700 px-5 py-4 space-y-4 bg-slate-800/20">
                  <p className="text-sm text-slate-300 leading-relaxed">{r.description}</p>
                  {r.responseToReporter && (
                    <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase mb-1">Sent to Reporter</p>
                      <p className="text-xs text-slate-300">{r.responseToReporter}</p>
                    </div>
                  )}
                  {r.adminNotes && (
                    <div className="bg-slate-800 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Internal Notes</p>
                      <p className="text-xs text-slate-400">{r.adminNotes}</p>
                    </div>
                  )}
                  <AdminReportActions report={r} onUpdate={updateStatus} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminReportActions({ report, onUpdate }: { report: any; onUpdate: (id: string, status: string, notes: string, response: string) => void }) {
  const [notes, setNotes] = useState(report.adminNotes || '');
  const [response, setResponse] = useState(report.responseToReporter || '');
  const [status, setStatus] = useState(report.status);
  const STATUS_OPTS = [
    { v: 'new',          l: 'New'          },
    { v: 'under_review', l: 'Under Review' },
    { v: 'resolved',     l: 'Resolved'     },
    { v: 'closed',       l: 'Closed'       },
  ];
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Update Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
          {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
          Response to Reporter <span className="text-indigo-400 normal-case font-normal">(visible when they check their tracking code)</span>
        </label>
        <textarea value={response} onChange={e => setResponse(e.target.value)}
          rows={3} placeholder="Write a message back to the reporter — e.g. 'We have received your report and are investigating.'…"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
      </div>
      <div>
        <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
          Internal Notes <span className="text-slate-600 normal-case font-normal">(HR only — not shown to reporter)</span>
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          rows={2} placeholder="Internal notes for HR team…"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
      </div>
      <button onClick={() => onUpdate(report._id, status, notes, response)}
        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  );
}

function AnnouncementsSection() {
  const { isHR } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'news', audiences: ['all'] as string[] });
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: isHR ? `${API_BASE_URL}/hr/announcements` : `${API_BASE_URL}/announcements`,
      showToast: false,
      thenFn: r => setAnnouncements(r.data?.data ?? r.data ?? []),
      finallyFn: () => setLoading(false),
    });
  }, [isHR]);

  useEffect(() => { load(); }, [load]);

  const publish = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setPosting(true);
    apiCallFunction({
      url: `${API_BASE_URL}/hr/announcements`,
      method: 'POST',
      data: form,
      thenFn: () => { load(); setShowCreate(false); setForm({ title: '', body: '', type: 'news', audiences: ['all'] }); },
      finallyFn: () => setPosting(false),
    });
  };

  const TYPE_COLORS: Record<string, string> = {
    news: 'text-blue-400 bg-blue-500/10',
    alert: 'text-red-400 bg-red-500/10',
    campaign: 'text-violet-400 bg-violet-500/10',
  };

  const AUDIENCE_OPTS = [
    { value: 'all',             label: 'Everyone' },
    { value: 'staff',           label: 'Staff only' },
    { value: 'department_head', label: 'Department Heads only' },
  ];

  const toggleAudience = (val: string) => {
    if (val === 'all') { setForm(f => ({ ...f, audiences: ['all'] })); return; }
    setForm(f => {
      const without = f.audiences.filter(a => a !== 'all' && a !== val);
      return { ...f, audiences: f.audiences.includes(val) ? without : [...without, val] };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Announcements</h2>
        {isHR && (
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Create Announcement</h3>
          <div className="flex gap-2">
            {[{ v: 'news', l: '📰 News' }, { v: 'alert', l: '🚨 Alert' }, { v: 'campaign', l: '📣 Campaign' }].map(({ v, l }) => (
              <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  form.type === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600')}>
                {l}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title *"
            className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4} placeholder="Write your announcement here…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Send To</p>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_OPTS.map(({ value, label }) => (
                <button key={value} onClick={() => toggleAudience(value)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    form.audiences.includes(value) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-slate-700 text-slate-500 hover:border-slate-600')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button onClick={publish} disabled={posting || !form.title.trim() || !form.body.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {posting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center">
          <Megaphone className="h-10 w-10 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[a.type] || TYPE_COLORS.news)}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-slate-100">{a.title}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', TYPE_COLORS[a.type] || TYPE_COLORS.news)}>
                      {a.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{a.body}</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {a.createdByName} · {new Date(a.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NAV ITEMS ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ElementType }[] = [
  { key: 'feed',          label: 'Company Feed',   icon: Newspaper   },
  { key: 'communities',   label: 'Communities',    icon: Users       },
  { key: 'celebrations',  label: 'Celebrations',   icon: Gift        },
  { key: 'meetings',      label: '1:1 Meetings',   icon: Video       },
  { key: 'trust',         label: 'Trust Channel',  icon: Shield      },
  { key: 'announcements', label: 'Announcements',  icon: Megaphone   },
];

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function CommunicationPage() {
  const [section, setSection] = useState<NavSection>('feed');
  const { userData } = useAuth();
  const userId: string | undefined = userData?.employeeId != null ? String(userData.employeeId) : undefined;

  return (
    <div className="flex h-full min-h-screen bg-[#0f172a]">
      {/* Left sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-800 py-6 px-3 flex flex-col gap-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Communication</p>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left',
              section === key
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50',
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {section === 'feed'          && <FeedSection userId={userId} />}
        {section === 'communities'   && <CommunitiesSection />}
        {section === 'celebrations'  && <CelebrationSection />}
        {section === 'meetings'      && <MeetingsSection />}
        {section === 'trust'         && <TrustChannelSection />}
        {section === 'announcements' && <AnnouncementsSection />}
      </main>
    </div>
  );
}
