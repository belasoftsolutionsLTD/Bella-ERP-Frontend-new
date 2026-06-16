'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  type: 'news' | 'alert' | 'campaign';
  audiences: string[];
  audience: string;
  department?: string;
  createdByName: string;
  createdAt: string;
}

interface CreateAnnouncementData {
  title: string;
  body: string;
  type: 'news' | 'alert' | 'campaign';
  audiences: string[];
}

interface Envelope { data: any }

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    apiCallFunction<Envelope>({
      url: `${API_BASE_URL}/hr/announcements`,
      showToast: false,
      thenFn: r => setAnnouncements(r.data ?? []),
      catchFn: () => {},
    }).finally(() => setLoading(false));
  }, []);

  const createAnnouncement = async (data: CreateAnnouncementData) => {
    setCreating(true);
    await apiCallFunction({
      url: `${API_BASE_URL}/hr/announcements`,
      method: 'POST',
      data,
      thenFn: () => fetchAll(),
    });
    setCreating(false);
  };

  const deleteAnnouncement = (id: string) =>
    apiCallFunction({
      url: `${API_BASE_URL}/hr/announcements/${id}`,
      method: 'DELETE',
      thenFn: () => setAnnouncements(prev => prev.filter(a => a._id !== id)),
    });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { announcements, loading, creating, fetchAll, createAnnouncement, deleteAnnouncement };
}
