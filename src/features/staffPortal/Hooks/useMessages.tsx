'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface Contact {
  _id: string;
  name: string;
  role: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  // Direct chat
  other: Contact | null;
  // Group chat
  isGroup?: boolean;
  groupName?: string;
  participantCount?: number;
  isAdmin?: boolean;
  admins?: string[];
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  attachments?: Attachment[];
  readBy: string[];
  createdAt: string;
  isSystem?: boolean;
}

export interface GroupMember {
  _id: string;
  name: string;
  role: string;
  isAdmin: boolean;
  isMe: boolean;
}

export interface GroupInfo {
  _id: string;
  groupName: string;
  participants: string[];
  admins: string[];
  isAdmin: boolean;
  members: GroupMember[];
  createdAt: string;
}

const BASE = `${API_BASE_URL}/me/messages`;

export function useMessages() {
  const [contacts, setContacts]               = useState<Contact[]>([]);
  const [groupContacts, setGroupContacts]     = useState<Contact[]>([]);
  const [conversations, setConversations]     = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId]     = useState<string | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(() => {
    apiCallFunction<{ data: Conversation[] }>({
      url: `${BASE}/conversations`,
      showToast: false,
      thenFn: r => setConversations(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const fetchContacts = useCallback(() => {
    apiCallFunction<{ data: Contact[] }>({
      url: `${BASE}/contacts`,
      showToast: false,
      thenFn: r => setContacts(r.data ?? []),
      catchFn: () => {},
    });
    // fetch all users for group creation (no role restriction)
    apiCallFunction<{ data: Contact[] }>({
      url: `${BASE}/contacts?forGroup=true`,
      showToast: false,
      thenFn: r => setGroupContacts(r.data ?? []),
      catchFn: () => {},
    });
  }, []);

  const fetchUnread = useCallback(() => {
    apiCallFunction<{ data: { count: number } }>({
      url: `${BASE}/unread`,
      showToast: false,
      thenFn: r => setUnreadCount(r.data?.count ?? 0),
      catchFn: () => {},
    });
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    fetchUnread();
  }, [fetchConversations, fetchContacts, fetchUnread]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchConversations();
      fetchUnread();
    }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations, fetchUnread]);

  const openConversation = useCallback((convoId: string) => {
    setActiveConvoId(convoId);
    setMessagesLoading(true);
    apiCallFunction<{ data: Message[] }>({
      url: `${BASE}/conversations/${convoId}`,
      showToast: false,
      thenFn: r => {
        setMessages(r.data ?? []);
        setMessagesLoading(false);
        setConversations(prev => prev.map(c => c._id === convoId ? { ...c, unread: 0 } : c));
        fetchUnread();
      },
      catchFn: () => setMessagesLoading(false),
    });
  }, [fetchUnread]);

  useEffect(() => {
    if (!activeConvoId) return;
    const id = setInterval(() => {
      apiCallFunction<{ data: Message[] }>({
        url: `${BASE}/conversations/${activeConvoId}`,
        showToast: false,
        thenFn: r => setMessages(r.data ?? []),
        catchFn: () => {},
      });
    }, 5000);
    return () => clearInterval(id);
  }, [activeConvoId]);

  const startConversation = useCallback((recipientId: string): Promise<string | null> => {
    return new Promise(resolve => {
      apiCallFunction<{ data: { _id: string } }>({
        url: `${BASE}/conversations`,
        method: 'POST',
        data: { recipientId },
        showToast: false,
        thenFn: r => {
          const id = r.data?._id ?? null;
          if (id) { fetchConversations(); openConversation(id); }
          resolve(id);
        },
        catchFn: () => resolve(null),
      });
    });
  }, [fetchConversations, openConversation]);

  const createGroup = useCallback((groupName: string, participantIds: string[]): Promise<string | null> => {
    return new Promise(resolve => {
      apiCallFunction<{ data: { _id: string } }>({
        url: `${BASE}/groups`,
        method: 'POST',
        data: { groupName, participantIds },
        showToast: false,
        thenFn: r => {
          const id = r.data?._id ?? null;
          if (id) { fetchConversations(); openConversation(id); }
          resolve(id);
        },
        catchFn: () => resolve(null),
      });
    });
  }, [fetchConversations, openConversation]);

  const fetchGroupInfo = useCallback((groupId: string): Promise<GroupInfo | null> => {
    return new Promise(resolve => {
      apiCallFunction<{ data: GroupInfo }>({
        url: `${BASE}/groups/${groupId}`,
        showToast: false,
        thenFn: r => resolve(r.data ?? null),
        catchFn: () => resolve(null),
      });
    });
  }, []);

  const updateGroup = useCallback((
    groupId: string,
    data: { groupName?: string; addMembers?: string[]; removeMembers?: string[] }
  ): Promise<boolean> => {
    return new Promise(resolve => {
      apiCallFunction<{ data: unknown }>({
        url: `${BASE}/groups/${groupId}`,
        method: 'PATCH',
        data,
        showToast: true,
        thenFn: () => { fetchConversations(); resolve(true); },
        catchFn: () => resolve(false),
      });
    });
  }, [fetchConversations]);

  const leaveGroup = useCallback((groupId: string): Promise<boolean> => {
    return new Promise(resolve => {
      apiCallFunction<{ data: unknown }>({
        url: `${BASE}/groups/${groupId}/leave`,
        method: 'DELETE',
        showToast: true,
        thenFn: () => {
          fetchConversations();
          setActiveConvoId(null);
          setMessages([]);
          resolve(true);
        },
        catchFn: () => resolve(false),
      });
    });
  }, [fetchConversations]);

  const sendMessage = useCallback((payload: { content?: string; files?: File[] }): Promise<boolean> => {
    if (!activeConvoId) return Promise.resolve(false);
    const { content = '', files = [] } = payload;
    if (!content.trim() && files.length === 0) return Promise.resolve(false);

    let data: FormData | { content: string };
    if (files.length > 0) {
      const fd = new FormData();
      if (content.trim()) fd.append('content', content.trim());
      files.forEach(f => fd.append('files', f));
      data = fd;
    } else {
      data = { content: content.trim() };
    }

    return new Promise(resolve => {
      apiCallFunction<{ data: Message }>({
        url: `${BASE}/conversations/${activeConvoId}`,
        method: 'POST',
        data,
        showToast: false,
        thenFn: r => {
          if (r.data) setMessages(prev => [...prev, r.data]);
          fetchConversations();
          resolve(true);
        },
        catchFn: () => resolve(false),
      });
    });
  }, [activeConvoId, fetchConversations]);

  const closeConversation = useCallback(() => {
    setActiveConvoId(null);
    setMessages([]);
  }, []);

  const activeConversation = conversations.find(c => c._id === activeConvoId) ?? null;

  return {
    contacts,
    groupContacts,
    conversations,
    activeConvoId,
    activeConversation,
    messages,
    messagesLoading,
    unreadCount,
    openConversation,
    closeConversation,
    startConversation,
    createGroup,
    fetchGroupInfo,
    updateGroup,
    leaveGroup,
    sendMessage,
    refetch: fetchConversations,
  };
}
