'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MessageSquare, FileText, Plus, X, Check, Send, Paperclip, Smile, Download } from 'lucide-react';

// Shared between the HR-side Project Detail page and the staff portal's My Projects
// panel — both talk to the exact same /projects/:id/messages and /projects/:id/chat-groups
// endpoints, gated by canAccessProject on the backend (any real member, not just HR/the
// supervisor), so there's no reason this UI should only exist on the admin side.

const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');
function projectFileUrl(filename: string) {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') ?? '') : '';
  return `${BACKEND_URL}/uploads/projects/${filename}?token=${encodeURIComponent(token)}`;
}

const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

export interface ProjectChatMember {
  employeeId: string;
  role: 'team_leader' | 'member';
  name: string;
  employee?: { fullName: string } | null;
}

export interface ProjectChatContext {
  _id: string;
  createdBy: string;
  supervisorName: string;
  members: ProjectChatMember[];
}

interface ChatMessage {
  _id: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachmentFilename?: string | null;
  attachmentOriginalName?: string | null;
  attachmentMimeType?: string | null;
  createdAt: string;
}

interface ChatGroup {
  _id: string;
  name: string;
  memberIds: string[];
}

const CHAT_EMOJIS = [
  '😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😤','😡','🥺','😩','😴','🤧','🤯','😷',
  '👍','👎','🙌','👏','🙏','💪','✌️','🤞','👋','🤝','👊','🫡',
  '❤️','💕','💔','🧡','💛','💚','💙','💜','🖤',
  '🎉','🔥','✨','⭐','💯','✅','❌','🎊','🏆','🎯','🚀','💡','💰','🍕','☕','🎵',
];

function ChatEmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-brand-border p-3 z-50 w-72">
      <div className="grid grid-cols-9 gap-0.5 max-h-52 overflow-y-auto">
        {CHAT_EMOJIS.map((e, i) => (
          <button key={i} type="button" onClick={() => { onSelect(e); onClose(); }}
            className="h-8 w-8 text-lg hover:bg-brand-bg-soft rounded-lg flex items-center justify-center transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function NewChatGroupModal({ project, onClose, onCreated }: { project: ProjectChatContext; onClose: () => void; onCreated: () => void }) {
  const { userData } = useAuth() as any;
  const myId = String(userData?._id ?? '');
  const [name, setName]         = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving]     = useState(false);

  const people = [
    { id: String(project.createdBy), name: project.supervisorName, role: 'Supervisor' },
    ...project.members.map(m => ({ id: String(m.employeeId), name: m.employee?.fullName ?? m.name, role: m.role.replace('_', ' ') })),
  ].filter(p => p.id !== myId);

  const toggle = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const create = () => {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${project._id}/chat-groups`,
      method: 'POST',
      data: { name: name.trim(), memberIds: [...selected] },
      showToast: false,
      thenFn: () => { onCreated(); onClose(); },
      finallyFn: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white border border-brand-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h2 className="text-[15px] font-bold text-brand-text">New Group Chat</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name, e.g. Comms Sub-team"
            className="w-full h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border rounded-lg text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary" />
          <div>
            <p className="text-[11px] font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">Members</p>
            {people.length === 0 ? (
              <p className="text-[12px] text-brand-text-muted px-1">No other project members to add.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-brand-border rounded-lg divide-y divide-brand-border/50">
                {people.map(p => {
                  const sel = selected.has(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggle(p.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-muted/40 transition-colors ${sel ? 'bg-brand-primary/10' : ''}`}>
                      <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-brand-primary border-brand-primary' : 'border-slate-500'}`}>
                        {sel && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <span className="text-[12px] text-brand-text truncate">{p.name}</span>
                      <span className="text-[10px] text-brand-text-muted ml-auto capitalize">{p.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border">
          <button onClick={onClose} className="px-3 h-8 text-[13px] text-brand-text-secondary hover:text-brand-text transition-colors">Cancel</button>
          <button onClick={create} disabled={!name.trim() || selected.size === 0 || saving}
            className="px-4 h-8 text-[13px] bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectChat({ project }: { project: ProjectChatContext }) {
  const projectId = project._id;
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [groups, setGroups]       = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup]   = useState(false);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const lastIdRef                 = useRef<string>('');
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const fetchGroups = useCallback(() => {
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/chat-groups`,
      showToast: false,
      thenFn: r => setGroups(r?.data ?? []),
    });
  }, [projectId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchMessages = useCallback((quiet = false) => {
    const groupParam = activeGroupId ? `&groupId=${activeGroupId}` : '';
    apiCallFunction<any>({
      url: `${API_BASE_URL}/projects/${projectId}/messages?limit=60${groupParam}`,
      showToast: false,
      thenFn: r => {
        const msgs: ChatMessage[] = r?.data ?? [];
        const newest = msgs.length > 0 ? msgs[msgs.length - 1]._id : '';
        if (newest !== lastIdRef.current) {
          lastIdRef.current = newest;
          setMessages(msgs);
          if (!quiet) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      },
    });
  }, [projectId, activeGroupId]);

  useEffect(() => {
    lastIdRef.current = '';
    setMessages([]);
    fetchMessages(false);
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const sendMsg = () => {
    if (!input.trim() && !file) return;
    setSending(true);
    const fd = new FormData();
    if (input.trim()) fd.append('message', input.trim());
    if (file) fd.append('file', file);
    if (activeGroupId) fd.append('groupId', activeGroupId);
    apiCallFunction({
      url: `${API_BASE_URL}/projects/${projectId}/messages`,
      method: 'POST',
      data: fd,
      showToast: false,
      thenFn: () => { setInput(''); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; fetchMessages(false); },
      finallyFn: () => setSending(false),
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) { setInput(v => v + emoji); return; }
    const start = el.selectionStart ?? input.length;
    const end   = el.selectionEnd ?? input.length;
    setInput(v => v.slice(0, start) + emoji + v.slice(end));
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + emoji.length; }, 0);
  };

  const ROLE_COLORS: Record<string, string> = {
    supervisor:   'text-brand-primary',
    team_leader:  'text-status-warning-text',
    member:       'text-brand-text-secondary',
  };

  const isImageAttachment = (mime?: string | null) => !!mime && mime.startsWith('image/');

  return (
    <div className="flex flex-col h-[560px] bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Channels */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-brand-border shrink-0">
        <button onClick={() => setActiveGroupId(null)}
          className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors',
            activeGroupId === null ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-soft')}>
          General
        </button>
        {groups.map(g => (
          <button key={g._id} onClick={() => setActiveGroupId(g._id)}
            className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors',
              activeGroupId === g._id ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-soft')}>
            # {g.name}
          </button>
        ))}
        <button onClick={() => setShowNewGroup(true)} title="Create a new group chat"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap shrink-0 text-brand-primary border border-dashed border-brand-primary/40 hover:bg-brand-primary/10 transition-colors ml-1">
          <Plus className="h-3.5 w-3.5" /> New Group
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-brand-text-muted gap-2">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m._id} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-brand-bg-muted flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-text-secondary mt-0.5">
              {m.senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-[12px] font-bold ${ROLE_COLORS[m.senderRole] ?? 'text-brand-text-secondary'}`}>
                  {m.senderName}
                </span>
                <span className="text-[10px] text-brand-text-muted capitalize">{m.senderRole.replace('_', ' ')}</span>
                <span className="text-[10px] text-brand-text-muted ml-auto">{fmtTime(m.createdAt)}</span>
              </div>
              {m.message && <p className="text-[13px] text-brand-text-secondary leading-relaxed break-words">{m.message}</p>}
              {m.attachmentFilename && (
                isImageAttachment(m.attachmentMimeType) ? (
                  <a href={projectFileUrl(m.attachmentFilename)} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5">
                    <img src={projectFileUrl(m.attachmentFilename)} alt={m.attachmentOriginalName ?? 'attachment'}
                      className="max-h-48 max-w-[220px] rounded-lg border border-brand-border object-cover" />
                  </a>
                ) : (
                  <a href={projectFileUrl(m.attachmentFilename)} target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg-soft border border-brand-border hover:bg-brand-bg-muted transition-colors max-w-full">
                    <FileText className="h-4 w-4 text-brand-text-muted shrink-0" />
                    <span className="text-[12px] text-brand-text truncate">{m.attachmentOriginalName || m.attachmentFilename}</span>
                    <Download className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
                  </a>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Attach preview */}
      {file && (
        <div className="px-3 pt-2 border-t border-brand-border">
          <div className="inline-flex items-center gap-2 bg-brand-bg-soft border border-brand-border rounded-lg px-2.5 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-brand-text-muted shrink-0" />
            <span className="text-[12px] text-brand-text truncate max-w-[200px]">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="h-4 w-4 rounded-full bg-brand-bg-muted hover:bg-brand-border-strong flex items-center justify-center shrink-0">
              <X className="h-2.5 w-2.5 text-brand-text-secondary" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-brand-border p-3 flex gap-2 items-center relative">
        {showEmoji && <ChatEmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach a file"
          className="h-9 w-9 shrink-0 rounded-xl text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft flex items-center justify-center transition-colors"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowEmoji(v => !v)}
          title="Emoji"
          className={cn(
            'h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-colors',
            showEmoji ? 'bg-amber-100 text-amber-600' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg-soft',
          )}
        >
          <Smile className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 h-9 px-3 text-[13px] bg-brand-bg-soft border border-brand-border-strong rounded-xl text-brand-text placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
        />
        <button
          onClick={sendMsg}
          disabled={sending || (!input.trim() && !file)}
          className="h-9 w-9 shrink-0 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {showNewGroup && (
        <NewChatGroupModal project={project} onClose={() => setShowNewGroup(false)}
          onCreated={() => { fetchGroups(); }} />
      )}
    </div>
  );
}
