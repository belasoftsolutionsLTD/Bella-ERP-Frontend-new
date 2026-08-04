'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

export interface EmailTemplate {
  trigger: string;
  label: string;
  description: string;
  module: string;
  tokens: string[];
  subject: string;
  body: string;
  defaultSubject: string;
  defaultBody: string;
  isCustomized: boolean;
  updatedAt: string | null;
}

// Mirrors useConfigSection's shape (fetch/create/update/remove) but talks to
// /api/email-templates, whose resource is a fixed, code-registered catalog of
// triggers rather than freely-creatable rows — there's no create/delete, only
// edit (save an override) and reset (drop back to the registered default).
export function useEmailTemplates() {
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    apiCallFunction<any>({
      url: `${API_BASE_URL}/email-templates`,
      showToast: false,
      thenFn: (res) => setItems(res.data ?? []),
      catchFn: (e: any) => setError(e?.message || 'Error'),
      finallyFn: () => setLoading(false),
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = (trigger: string, data: { subject: string; body: string }, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/email-templates/${trigger}`,
      method: 'PUT',
      data,
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  const reset = (trigger: string, onSuccess?: () => void) =>
    apiCallFunction({
      url: `${API_BASE_URL}/email-templates/${trigger}`,
      method: 'DELETE',
      thenFn: () => { fetch(); onSuccess?.(); },
    });

  return { items, loading, error, refetch: fetch, save, reset };
}
