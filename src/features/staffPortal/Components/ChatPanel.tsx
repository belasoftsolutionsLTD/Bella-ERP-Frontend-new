'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, ArrowLeft, Search, Loader2,
  UserCircle, Plus, X, Megaphone, CheckCheck,
  Paperclip, Smile, FileText, Download, Users,
  ChevronRight, LogOut, UserPlus, Pencil, Check, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages } from '../Hooks/useMessages';
import type { GroupInfo } from '../Hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/configs/constants';
import type { Attachment } from '../Hooks/useMessages';
import type { Announcement } from '../Hooks/useMyPortal';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  hr_manager: 'HR Manager', super_admin: 'Super Admin',
  department_head: 'Dept Head', staff: 'Staff',
};
const ROLE_COLOR: Record<string, string> = {
  hr_manager: 'bg-violet-100 text-violet-700', super_admin: 'bg-red-100 text-red-700',
  department_head: 'bg-blue-100 text-blue-700', staff: 'bg-gray-100 text-gray-600',
};
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',     'from-fuchsia-500 to-violet-600',
];
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

const EMOJIS = [
  '😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😤','😡','🥺','😩','😴','🤧','🤯','😷',
  '👍','👎','🙌','👏','🙏','💪','✌️','🤞','👋','🤝','👊','🫡',
  '❤️','💕','💔','🧡','💛','💚','💙','💜','🖤',
  '🎉','🔥','✨','⭐','💯','✅','❌','🎊','🏆','🎯','🚀','💡','💰','🍕','☕','🎵',
];

// ── Helper components ─────────────────────────────────────────────────────────

function Avatar({ name, size = 'md', group = false }: { name: string; size?: 'sm' | 'md'; group?: boolean }) {
  if (group) {
    return (
      <div className={cn(
        'rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
      )}>
        <Users className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>
    );
  }
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0',
      avatarColor(name),
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
    )}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString('en-KE', { weekday: 'short' });
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function renderContent(content: string, isMine: boolean) {
  if (!content) return null;
  const urlRegex = /https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(content)) !== null) {
    if (m.index > last) nodes.push(<span key={last}>{content.slice(last, m.index)}</span>);
    nodes.push(
      <a key={m.index} href={m[0]} target="_blank" rel="noopener noreferrer"
         className={cn('underline break-all', isMine ? 'text-white/90' : 'text-primary/90')}>
        {m[0]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < content.length) nodes.push(<span key={last}>{content.slice(last)}</span>);
  return nodes.length ? <>{nodes}</> : content;
}

async function fetchBlobWithAuth(src: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  const res = await fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('fetch failed');
  return res.blob();
}

function AuthenticatedImage({ src, alt, originalName }: {
  src: string; alt: string; originalName: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    let revoked = false;
    fetchBlobWithAuth(src)
      .then(blob => { if (!revoked) setBlobUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => {
      revoked = true;
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [src]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = originalName;
    a.click();
  };

  const handleShare = async () => {
    if (!blobUrl || !navigator.share) return;
    try {
      const blob = await fetch(blobUrl).then(r => r.blob());
      const file = new File([blob], originalName, { type: blob.type });
      await navigator.share({ files: [file], title: originalName });
    } catch {}
  };

  if (!blobUrl) return <div className="w-[220px] h-36 rounded-2xl bg-gray-100 animate-pulse" />;

  return (
    <div className="relative group rounded-2xl overflow-hidden shadow-sm cursor-pointer"
         onClick={handleDownload}>
      <img src={blobUrl} alt={alt} className="max-w-[220px] block" />
      {/* action overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end justify-end gap-1.5 p-2 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          title="Download"
          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
          <Download className="h-3.5 w-3.5" />
        </button>
        {canShare && (
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            title="Share"
            className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AttachmentFile({ att, isMine }: { att: Attachment; isMine: boolean }) {
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const url = `${API_BASE_URL}/me/messages/attachments/${att.filename}`;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const blob = await fetchBlobWithAuth(url);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = att.originalName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
    setBusy(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.share) return;
    try {
      const blob = await fetchBlobWithAuth(url);
      const file = new File([blob], att.originalName, { type: att.mimetype });
      await navigator.share({ files: [file], title: att.originalName });
    } catch {}
  };

  return (
    <div className={cn(
      'flex items-center gap-2.5 mt-1.5 px-3 py-2.5 rounded-2xl text-xs w-[240px]',
      isMine ? 'bg-white/15 text-white' : 'bg-gray-50 border border-gray-100 text-foreground',
    )}>
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
        isMine ? 'bg-white/20' : 'bg-primary/10',
      )}>
        <FileText className={cn('h-4 w-4', isMine ? 'text-white' : 'text-primary')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate max-w-[120px] font-semibold text-[11px]">{att.originalName}</p>
        <p className={cn('text-[10px] mt-0.5', isMine ? 'text-white/50' : 'text-foreground/40')}>
          {formatFileSize(att.size)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={handleDownload} title="Download"
          className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors',
            isMine ? 'hover:bg-white/20' : 'hover:bg-primary/10 text-primary')}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        </button>
        {canShare && (
          <button onClick={handleShare} title="Share"
            className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors',
              isMine ? 'hover:bg-white/20' : 'hover:bg-primary/10 text-primary')}>
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function MessageAttachments({ attachments, isMine }: { attachments: Attachment[]; isMine: boolean }) {
  return (
    <>
      {attachments.map((att, i) => {
        const isImage = att.mimetype?.startsWith('image/');
        const url = `${API_BASE_URL}/me/messages/attachments/${att.filename}`;
        if (isImage) {
          return <AuthenticatedImage key={i} src={url} alt={att.originalName} originalName={att.originalName} />;
        }
        return <AttachmentFile key={i} att={att} isMine={isMine} />;
      })}
    </>
  );
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 w-72">
      <div className="grid grid-cols-9 gap-0.5 max-h-52 overflow-y-auto">
        {EMOJIS.map((e, i) => (
          <button key={i} onClick={() => { onSelect(e); onClose(); }}
            className="h-8 w-8 text-lg hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function AttachPreview({ file, preview, onRemove }: { file: File; preview: string; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="relative group shrink-0">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="h-14 w-14 rounded-xl object-cover border border-gray-200" />
      ) : (
        <div className="h-14 w-14 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5 px-1">
          <FileText className="h-5 w-5 text-foreground/30" />
          <span className="text-[9px] text-foreground/40 truncate w-full text-center px-1">{file.name}</span>
        </div>
      )}
      <button onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ── Group Info Panel ──────────────────────────────────────────────────────────

function GroupInfoPanel({
  groupInfo, contacts, onClose, onLeave, onUpdate,
}: {
  groupInfo: GroupInfo;
  contacts: { _id: string; name: string; role: string }[];
  onClose: () => void;
  onLeave: () => void;
  onUpdate: (data: { groupName?: string; addMembers?: string[]; removeMembers?: string[] }) => Promise<boolean>;
}) {
  const [renaming, setRenaming]       = useState(false);
  const [newName, setNewName]         = useState(groupInfo.groupName);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addSearch, setAddSearch]     = useState('');
  const [selected, setSelected]       = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);

  const memberIds = new Set(groupInfo.members.map(m => String(m._id)));
  const addable   = contacts.filter(c => !memberIds.has(String(c._id)));
  const filtered  = addable.filter(c => c.name.toLowerCase().includes(addSearch.toLowerCase()));

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === groupInfo.groupName) { setRenaming(false); return; }
    setSaving(true);
    await onUpdate({ groupName: newName.trim() });
    setSaving(false);
    setRenaming(false);
  };

  const handleAddMembers = async () => {
    if (!selected.length) return;
    setSaving(true);
    await onUpdate({ addMembers: selected });
    setSaving(false);
    setSelected([]);
    setShowAddMembers(false);
  };

  const handleRemove = async (memberId: string) => {
    setSaving(true);
    await onUpdate({ removeMembers: [memberId] });
    setSaving(false);
  };

  return (
    <div className="w-72 shrink-0 border-l bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <span className="text-sm font-bold">Group Info</span>
        <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
          <X className="h-4 w-4 text-foreground/50" />
        </button>
      </div>

      {/* Group name */}
      <div className="px-4 py-4 border-b bg-white">
        <div className="flex items-center justify-center mb-3">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
        {renaming ? (
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              className="flex-1 text-sm font-semibold border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleRename} disabled={saving}
              className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { setRenaming(false); setNewName(groupInfo.groupName); }}
              className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-foreground">{groupInfo.groupName}</span>
            {groupInfo.isAdmin && (
              <button onClick={() => setRenaming(true)} className="text-foreground/30 hover:text-primary transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-foreground/40 text-center mt-1">{groupInfo.members.length} members</p>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Members</span>
          {groupInfo.isAdmin && (
            <button onClick={() => setShowAddMembers(v => !v)}
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              <UserPlus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>

        {showAddMembers && groupInfo.isAdmin && (
          <div className="px-4 pb-3">
            <input
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Search people…"
              className="w-full text-xs px-3 py-1.5 rounded-lg bg-white border focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-foreground/30 text-center py-2">No contacts to add</p>
              ) : filtered.map(c => (
                <button key={c._id} onClick={() => toggleSelect(c._id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-xs',
                    selected.includes(c._id) ? 'bg-primary/10 text-primary' : 'hover:bg-white',
                  )}>
                  <Avatar name={c.name} size="sm" />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  {selected.includes(c._id) && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <button onClick={handleAddMembers} disabled={saving}
                className="w-full mt-2 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Add ${selected.length} member${selected.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {groupInfo.members.map(m => (
            <div key={m._id} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar name={m.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {m.name}{m.isMe ? ' (You)' : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLOR[m.role] ?? 'bg-gray-100 text-gray-500')}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                  {m.isAdmin && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Admin</span>
                  )}
                </div>
              </div>
              {groupInfo.isAdmin && !m.isMe && (
                <button onClick={() => handleRemove(String(m._id))}
                  className="h-6 w-6 rounded-full hover:bg-red-50 flex items-center justify-center text-foreground/20 hover:text-red-500 transition-colors"
                  title="Remove from group">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave group */}
      <div className="px-4 py-3 border-t bg-white">
        <button onClick={onLeave}
          className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" />
          Leave Group
        </button>
      </div>
    </div>
  );
}

// ── New chat modes ─────────────────────────────────────────────────────────────

type NewChatMode = 'hidden' | 'choose' | 'direct' | 'group';

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  announcements: Announcement[];
  onReadAnnouncement: (id: string) => void;
}

export function ChatPanel({ announcements, onReadAnnouncement }: Props) {
  const { userData } = useAuth();
  const {
    contacts, groupContacts, conversations, activeConvoId, activeConversation,
    messages, messagesLoading,
    openConversation, closeConversation, startConversation,
    createGroup, fetchGroupInfo, updateGroup, leaveGroup, sendMessage,
  } = useMessages();

  const [tab, setTab]                   = useState<'messages' | 'announcements'>('messages');
  const [search, setSearch]             = useState('');
  const [newChatMode, setNewChatMode]   = useState<NewChatMode>('hidden');
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments]   = useState<File[]>([]);
  const [previews, setPreviews]         = useState<string[]>([]);

  // Group creation state
  const [groupName, setGroupName]         = useState('');
  const [groupMembers, setGroupMembers]   = useState<string[]>([]);
  const [groupSearch, setGroupSearch]     = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Group info panel
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupInfo, setGroupInfo]         = useState<GroupInfo | null>(null);
  const [loadingInfo, setLoadingInfo]     = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => { previews.forEach(p => p && URL.revokeObjectURL(p)); }, []);

  // Close group info when switching conversations
  useEffect(() => {
    setShowGroupInfo(false);
    setGroupInfo(null);
  }, [activeConvoId]);

  const openGroupInfo = useCallback(async () => {
    if (!activeConvoId) return;
    setLoadingInfo(true);
    setShowGroupInfo(true);
    const info = await fetchGroupInfo(activeConvoId);
    setGroupInfo(info);
    setLoadingInfo(false);
  }, [activeConvoId, fetchGroupInfo]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const ta = inputRef.current;
    if (!ta) { setInput(v => v + emoji); return; }
    const start = ta.selectionStart ?? input.length;
    const end   = ta.selectionEnd   ?? input.length;
    setInput(v => v.slice(0, start) + emoji + v.slice(end));
    requestAnimationFrame(() => {
      ta.selectionStart = start + emoji.length;
      ta.selectionEnd   = start + emoji.length;
      ta.focus();
    });
  }, [input]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setAttachments(prev => [...prev, ...files]);
    files.forEach(f => {
      const url = f.type.startsWith('image/') ? URL.createObjectURL(f) : '';
      setPreviews(prev => [...prev, url]);
    });
    e.target.value = '';
  };

  const removeAttachment = (i: number) => {
    if (previews[i]) URL.revokeObjectURL(previews[i]);
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;
    setSending(true);
    const filesToSend = [...attachments];
    setInput('');
    setAttachments([]);
    previews.forEach(p => p && URL.revokeObjectURL(p));
    setPreviews([]);
    setShowEmojiPicker(false);
    await sendMessage({ content: text, files: filesToSend });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewDirect = async (contactId: string) => {
    setNewChatMode('hidden');
    setContactSearch('');
    await startConversation(contactId);
    setTab('messages');
  };

  const toggleGroupMember = (id: string) =>
    setGroupMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0 || creatingGroup) return;
    setCreatingGroup(true);
    await createGroup(groupName.trim(), groupMembers);
    setCreatingGroup(false);
    setGroupName('');
    setGroupMembers([]);
    setGroupSearch('');
    setNewChatMode('hidden');
    setTab('messages');
  };

  const handleLeaveGroup = async () => {
    if (!activeConvoId) return;
    await leaveGroup(activeConvoId);
    setShowGroupInfo(false);
    setGroupInfo(null);
  };

  const handleUpdateGroup = async (data: { groupName?: string; addMembers?: string[]; removeMembers?: string[] }) => {
    if (!activeConvoId) return false;
    const ok = await updateGroup(activeConvoId, data);
    if (ok) {
      const info = await fetchGroupInfo(activeConvoId);
      setGroupInfo(info);
    }
    return ok;
  };

  const closeNewChat = () => {
    setNewChatMode('hidden');
    setContactSearch('');
    setGroupName('');
    setGroupMembers([]);
    setGroupSearch('');
  };

  const filteredConversations = conversations.filter(c => {
    const name = c.isGroup ? c.groupName : c.other?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const groupFilteredContacts = groupContacts.filter(c =>
    c.name.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const unreadAnnouncements = announcements.filter(a => !a.isRead).length;
  const myUserId  = userData?._id ?? userData?.id ?? '';
  const canSend   = (input.trim().length > 0 || attachments.length > 0) && !sending;
  const isGroup   = activeConversation?.isGroup ?? false;

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[400px] rounded-xl border overflow-hidden bg-white">

      {/* ── Left pane ── */}
      <div className={cn(
        'flex flex-col border-r bg-gray-50',
        activeConvoId ? 'hidden md:flex md:w-72 shrink-0' : 'w-full md:w-72 shrink-0',
      )}>
        <div className="px-4 pt-4 pb-3 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground text-sm">Messages</h3>
            <button
              onClick={() => newChatMode === 'hidden' ? setNewChatMode('choose') : closeNewChat()}
              className="h-7 w-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
            >
              {newChatMode !== 'hidden' ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex gap-1 mb-3">
            <button onClick={() => setTab('messages')}
              className={cn('flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors',
                tab === 'messages' ? 'bg-primary text-white' : 'text-foreground/50 hover:bg-gray-100')}>
              Chats
            </button>
            <button onClick={() => setTab('announcements')}
              className={cn('flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors relative',
                tab === 'announcements' ? 'bg-primary text-white' : 'text-foreground/50 hover:bg-gray-100')}>
              Notices
              {unreadAnnouncements > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadAnnouncements}
                </span>
              )}
            </button>
          </div>

          {/* Search / new-chat controls */}
          {tab === 'messages' && newChatMode === 'hidden' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Choose new chat type ── */}
          {tab === 'messages' && newChatMode === 'choose' && (
            <div className="p-3 space-y-2">
              <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wide px-1 mb-1">Start a chat</p>
              <button onClick={() => setNewChatMode('direct')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Direct Message</p>
                  <p className="text-xs text-foreground/40">Chat with one person</p>
                </div>
                <ChevronRight className="h-4 w-4 text-foreground/20 ml-auto" />
              </button>
              <button onClick={() => setNewChatMode('group')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors text-left">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold">New Group</p>
                  <p className="text-xs text-foreground/40">Create a group chat</p>
                </div>
                <ChevronRight className="h-4 w-4 text-foreground/20 ml-auto" />
              </button>
            </div>
          )}

          {/* ── Direct message contact picker ── */}
          {tab === 'messages' && newChatMode === 'direct' && (
            <div className="flex flex-col h-full">
              <div className="px-3 pt-2 pb-1">
                <button onClick={() => setNewChatMode('choose')} className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground mb-2">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                  <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search people…" autoFocus
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
              <div className="divide-y overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="py-12 text-center text-foreground/30 text-xs px-4">No contacts found.</div>
                ) : filteredContacts.map(c => (
                  <button key={c._id} onClick={() => handleNewDirect(c._id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors">
                    <Avatar name={c.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLOR[c.role] ?? 'bg-gray-100 text-gray-500')}>
                        {ROLE_LABEL[c.role] ?? c.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Group creation ── */}
          {tab === 'messages' && newChatMode === 'group' && (
            <div className="p-3 flex flex-col gap-3">
              <button onClick={() => setNewChatMode('choose')} className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Group name…"
                className="w-full text-xs px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
                <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                  placeholder="Add people…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>

              {groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {groupMembers.map(id => {
                    const c = contacts.find(x => x._id === id);
                    if (!c) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {c.name}
                        <button onClick={() => toggleGroupMember(id)}><X className="h-2.5 w-2.5" /></button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="max-h-48 overflow-y-auto divide-y rounded-xl bg-white border">
                {groupFilteredContacts.length === 0 ? (
                  <div className="py-6 text-center text-foreground/30 text-xs">No contacts found</div>
                ) : groupFilteredContacts.map(c => (
                  <button key={c._id} onClick={() => toggleGroupMember(c._id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      groupMembers.includes(c._id) ? 'bg-primary/5' : 'hover:bg-gray-50',
                    )}>
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLOR[c.role] ?? 'bg-gray-100 text-gray-500')}>
                        {ROLE_LABEL[c.role] ?? c.role}
                      </span>
                    </div>
                    {groupMembers.includes(c._id) && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || groupMembers.length === 0 || creatingGroup}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                  groupName.trim() && groupMembers.length > 0
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                )}
              >
                {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {creatingGroup ? 'Creating…' : `Create Group${groupMembers.length > 0 ? ` (${groupMembers.length + 1})` : ''}`}
              </button>
            </div>
          )}

          {/* ── Announcements list ── */}
          {tab === 'announcements' && (
            <div className="divide-y">
              {announcements.length === 0 ? (
                <div className="py-12 text-center text-foreground/30 text-xs">No announcements yet</div>
              ) : announcements.map(a => (
                <button key={a._id}
                  onClick={() => { setSelectedAnnouncement(a); if (!a.isRead) onReadAnnouncement(a._id); }}
                  className={cn('w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white',
                    selectedAnnouncement?._id === a._id ? 'bg-white border-l-2 border-primary' : !a.isRead ? 'bg-blue-50' : '')}>
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    a.isRead ? 'bg-gray-100' : 'bg-primary/10')}>
                    <Megaphone className={cn('h-4 w-4', a.isRead ? 'text-foreground/30' : 'text-primary')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('text-xs font-semibold truncate', a.isRead ? 'text-foreground/50' : 'text-foreground')}>{a.title}</p>
                      {!a.isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-foreground/40 truncate mt-0.5">{a.body}</p>
                    <p className="text-xs text-foreground/30 mt-0.5">{formatTime(a.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── Conversations list ── */}
          {tab === 'messages' && newChatMode === 'hidden' && (
            <div className="divide-y">
              {filteredConversations.length === 0 ? (
                <div className="py-12 text-center text-foreground/30 text-xs px-4">
                  {conversations.length === 0 ? 'No conversations yet. Click + to start one.' : 'No results.'}
                </div>
              ) : filteredConversations.map(c => (
                <button key={c._id} onClick={() => openConversation(c._id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white',
                    activeConvoId === c._id ? 'bg-white border-l-2 border-primary' : '')}>
                  <div className="relative shrink-0">
                    {c.isGroup
                      ? <Avatar name="" size="md" group />
                      : <Avatar name={c.other?.name ?? '?'} />
                    }
                    {c.unread > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {c.unread > 9 ? '9+' : c.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-xs font-semibold truncate', c.unread ? 'text-foreground' : 'text-foreground/70')}>
                        {c.isGroup ? c.groupName : (c.other?.name ?? 'Unknown')}
                      </p>
                      {c.lastMessageAt && (
                        <span className="text-xs text-foreground/30 shrink-0">{formatTime(c.lastMessageAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {c.isGroup && (
                        <span className="text-xs text-foreground/30">{c.participantCount} members ·</span>
                      )}
                      <p className={cn('text-xs truncate', c.unread ? 'text-foreground/70 font-medium' : 'text-foreground/40')}>
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right pane ── */}
      <div className={cn('flex flex-col flex-1 min-w-0', !activeConvoId && !selectedAnnouncement && 'hidden md:flex')}>

        {/* Announcement detail */}
        {tab === 'announcements' && selectedAnnouncement ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
              <button onClick={() => setSelectedAnnouncement(null)}
                className="md:hidden h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-foreground/50">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{selectedAnnouncement.title}</p>
                <p className="text-xs text-foreground/40">
                  {selectedAnnouncement.createdByName} · {formatTime(selectedAnnouncement.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#f0f2f5]">
              <div className="bg-white rounded-2xl shadow-sm p-5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.body}
              </div>
            </div>
          </div>

        ) : !activeConvoId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground/60 text-sm">
                {tab === 'announcements' ? 'Select a notice to read it' : 'Select a conversation'}
              </p>
              <p className="text-xs text-foreground/30 mt-1">
                {tab === 'announcements' ? 'Click any notice on the left' : 'Or click + to start a new one'}
              </p>
            </div>
          </div>

        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Chat area */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
                <button onClick={closeConversation}
                  className="md:hidden h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-foreground/50">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                {isGroup
                  ? <Avatar name="" group />
                  : activeConversation?.other && <Avatar name={activeConversation.other.name} />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {isGroup ? activeConversation?.groupName : (activeConversation?.other?.name ?? 'Conversation')}
                  </p>
                  {isGroup ? (
                    <p className="text-xs text-foreground/40">
                      {activeConversation?.participantCount} members
                    </p>
                  ) : activeConversation?.other?.role && (
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLOR[activeConversation.other.role] ?? 'bg-gray-100 text-gray-500')}>
                      {ROLE_LABEL[activeConversation.other.role] ?? activeConversation.other.role}
                    </span>
                  )}
                </div>
                {isGroup && (
                  <button
                    onClick={() => showGroupInfo ? setShowGroupInfo(false) : openGroupInfo()}
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                      showGroupInfo ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-foreground/40',
                    )}
                    title="Group info"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f0f2f5]">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <UserCircle className="h-10 w-10 text-foreground/20" />
                    <p className="text-xs text-foreground/30">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((m, i) => {
                      // System messages render as a centred grey pill
                      if (m.isSystem) {
                        return (
                          <div key={m._id} className="flex justify-center my-1">
                            <span className="text-xs text-foreground/40 bg-black/5 rounded-full px-3 py-0.5">
                              {m.content}
                            </span>
                          </div>
                        );
                      }

                      const isMine      = String(m.senderId) === String(myUserId);
                      const prevMsg     = messages[i - 1];
                      const sameAuthor  = prevMsg && !prevMsg.isSystem && String(prevMsg.senderId) === String(m.senderId);
                      // In groups always show sender name; in DMs only show if author changed
                      const showSender  = !isMine && (!sameAuthor || isGroup);
                      const showTime    = !messages[i + 1] ||
                        new Date(messages[i + 1].createdAt).getTime() - new Date(m.createdAt).getTime() > 300000;
                      const hasAttachments = (m.attachments?.length ?? 0) > 0;
                      const hasText = m.content?.trim().length > 0;

                      return (
                        <div key={m._id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div className={cn('max-w-[72%] flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
                            {showSender && (
                              <span className="text-xs text-foreground/40 px-1 mb-0.5">{m.senderName}</span>
                            )}
                            {/* Text bubble — only rendered when there is text */}
                            {hasText && (
                              <div className={cn(
                                'px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                                isMine ? 'bg-primary text-white rounded-tr-sm' : 'bg-white text-foreground shadow-sm rounded-tl-sm',
                              )}>
                                <p className="whitespace-pre-wrap">{renderContent(m.content, isMine)}</p>
                              </div>
                            )}
                            {/* Attachments always rendered outside the colored bubble */}
                            {hasAttachments && (
                              <MessageAttachments attachments={m.attachments!} isMine={isMine} />
                            )}
                            {showTime && (
                              <div className={cn('flex items-center gap-1 px-1', isMine ? 'justify-end' : 'justify-start')}>
                                <span className="text-xs text-foreground/30">{formatTime(m.createdAt)}</span>
                                {isMine && <CheckCheck className="h-3 w-3 text-foreground/30" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Attachment previews */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-t bg-white flex gap-2 flex-wrap">
                  {attachments.map((f, i) => (
                    <AttachPreview key={i} file={f} preview={previews[i]} onRemove={() => removeAttachment(i)} />
                  ))}
                </div>
              )}

              {/* Input bar */}
              <div className="relative px-4 py-3 border-t bg-white shrink-0">
                {showEmojiPicker && (
                  <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                )}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(v => !v)}
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0 mb-0.5',
                      showEmojiPicker ? 'bg-amber-100 text-amber-600' : 'text-foreground/40 hover:bg-gray-100 hover:text-foreground/70',
                    )}
                    title="Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none px-3.5 py-2.5 text-sm rounded-2xl bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32 leading-relaxed"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/40 hover:bg-gray-100 hover:text-foreground/70 transition-colors shrink-0 mb-0.5"
                    title="Attach file or image"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />
                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0',
                      canSend ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                    )}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Group info side panel */}
            {isGroup && showGroupInfo && (
              loadingInfo || !groupInfo ? (
                <div className="w-72 shrink-0 border-l flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
                </div>
              ) : (
                <GroupInfoPanel
                  groupInfo={groupInfo}
                  contacts={contacts}
                  onClose={() => setShowGroupInfo(false)}
                  onLeave={handleLeaveGroup}
                  onUpdate={handleUpdateGroup}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
